// server.local.cjs — Combined API for local & production
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Helpers ----------
const DB_FILE = path.join(process.cwd(), 'api', '_raffle.json');
function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return { tickets:{}, payments:[], users:{}, credits:{}, submissions:[], raffle:{ history: [] }, spotlight:{}, emails:[] };
  }
}
function writeDb(data) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive:true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data,null,2));
}
function next10amISTasUTCDate() {
  const tz = 'Asia/Kolkata';
  const now = new Date();
  const nowIST = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const target = new Date(nowIST); target.setHours(10,0,0,0);
  if(target <= nowIST) target.setDate(target.getDate()+1);
  return new Date(target.toLocaleString('en-US', { timeZone:'UTC' }));
}

// ---------- Middleware ----------
app.use(cors({ origin: /^http:\/\/localhost:\d+$/, credentials:false }));
app.use(express.json());

// ---------- Stripe Setup ----------
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_testplaceholder';
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY,{timeout:120000}) : null;
const PRICE_PER_ENTRY = 700; // cents

// ---------- Health ----------
app.get('/api/health', (_req,res)=>res.json({ok:true}));

// ---------- Qualification Gate ----------
app.post('/api/qualify',(req,res)=>{
  const { path:userPath, skill, fun, feedback } = req.body||{};
  if(!userPath) return res.status(400).json({error:'Path is required'});
  if(userPath==='paid' && (!skill||!fun||!feedback)) return res.status(400).json({error:'All quiz fields required'});
  const token = `ticket_${Math.random().toString(36).slice(2,10)}`;
  res.json({message:'Qualification submitted', token, tier:userPath==='paid'?'paid':'free'});
});

// ---------- Raffle ----------
function pickRaffleWinner(db){
  const pool = [];
  for(const [uid,count] of Object.entries(db.tickets||{})){
    for(let i=0;i<Number(count||0);i++) pool.push(uid);
  }
  if(!pool.length) return null;
  const idx = Number(new Date().toISOString().slice(0,10).replace(/-/g,'')) % pool.length;
  const winnerId = pool[idx];
  return { userId:winnerId, tickets: db.tickets[winnerId]||0 };
}

app.get('/api/raffle/tickets/:userId',(req,res)=>{
  const db = readDb();
  const uid = String(req.params.userId||'').trim();
  res.json({userId:uid, tickets: db.tickets?.[uid]||0});
});

app.post('/api/raffle/credit',(req,res)=>{
  const { userId, entries } = req.body||{};
  const uid = String(userId||'').trim();
  const n = Number(entries||0);
  if(!uid||n<1) return res.status(400).json({error:'userId and entries required'});
  const db = readDb();
  db.tickets[uid] = (db.tickets[uid]||0)+n;
  const paymentId = 'pay_'+Math.random().toString(36).slice(2,10);
  db.payments.push({ paymentId,userId:uid,entries:n,amount:n*PRICE_PER_ENTRY,timestamp:new Date().toISOString(),source:'local_mock' });
  writeDb(db);
  res.json({ok:true,userId:uid,entries:n,paymentId,totalTickets:db.tickets[uid]});
});

app.get('/api/raffle/winner',(_req,res)=>{
  const db = readDb();
  res.json({winner:db.raffle?.lastWinner||null,history:db.raffle?.history?.slice(-10)||[]});
});

app.all('/api/raffle/run',(_req,res)=>{
  const db = readDb();
  const win = pickRaffleWinner(db);
  if(!win) return res.json({ok:true,message:'No tickets'});
  db.raffle = db.raffle||{history:[]};
  db.raffle.lastWinner = {...win, selectedAtUTC:new Date().toISOString()};
  db.raffle.history.push(db.raffle.lastWinner);
  writeDb(db);
  res.json({ok:true,winner:db.raffle.lastWinner});
});

// ---------- Daily Spotlight ----------
function pickSpotlightWinner(db){
  const subs = db.submissions?.length?db.submissions:[
    {id:'u1',name:'Alex Kumar',points:847,title:'Advanced React Performance Optimization',submittedAt:'2025-08-14T03:00:00Z'},
    {id:'u2',name:'Priya N',points:802,title:'Type-safe APIs with Zod + tRPC',submittedAt:'2025-08-14T04:30:00Z'},
    {id:'u3',name:'Rahul S',points:780,title:'Edge caching patterns for SPA',submittedAt:'2025-08-14T05:00:00Z'},
  ];
  subs.sort((a,b)=> (b.points-a.points)||(new Date(a.submittedAt)-new Date(b.submittedAt))||String(a.id).localeCompare(String(b.id)));
  return subs[0];
}

function runSpotlightOnce(){
  const db = readDb();
  const winner = pickSpotlightWinner(db);
  const today = new Date().toISOString().slice(0,10);
  db.credits=db.credits||{};
  db.users=db.users||{};
  db.spotlight=db.spotlight||{};
  db.emails=db.emails||[];
  if(db.spotlight.date!==today){
    db.credits[winner.id]=(db.credits[winner.id]||0)+100;
    db.users[winner.id]={id:winner.id,credits:(db.users[winner.id]?.credits||0)+100,raffleTickets:db.tickets?.[winner.id]||0};
    db.spotlight.date=today;
    db.spotlight.credited=true;
    db.spotlight.creditsGranted=100;
  }
  db.spotlight.winner=winner;
  db.spotlight.selectedAtUTC=new Date().toISOString();
  db.spotlight.nextSelectionUTC=next10amISTasUTCDate().toISOString();
  db.emails.push({to:winner.name,subject:"Today's Spotlight Winner",body:`Congrats ${winner.name} "${winner.title}" won 100 credits.`,timestamp:new Date().toISOString()});
  writeDb(db);
  return db.spotlight;
}

app.get('/api/spotlight/current',(_req,res)=>res.json(runSpotlightOnce()));
app.post('/api/spotlight/run',(_req,res)=>res.json({ok:true,...runSpotlightOnce()}));
app.get('/api/spotlight/emails',(_req,res)=>res.json({emails:(readDb().emails||[]).slice(-10).reverse()}));
app.post('/api/spotlight/email',(_req,res)=>{
  const spot = runSpotlightOnce();
  const db = readDb();
  db.emails.push({to:spot.winner.name,subject:"Today's Spotlight Winner",body:`Congrats ${spot.winner.name}`,timestamp:new Date().toISOString()});
  writeDb(db);
  res.json({ok:true,sentAt:new Date().toISOString(),to:spot.winner.name});
});

// ---------- Stripe Checkout & Webhook ----------
app.post('/api/payment/create-checkout',async(req,res)=>{
  try{
    const { userId, entries } = req.body||{};
    if(!stripe) return res.status(501).json({error:'Stripe not configured'});
    if(!userId||entries<1) return res.status(400).json({error:'userId and entries required'});
    const session = await stripe.checkout.sessions.create({
      mode:'payment',
      payment_method_types:['card'],
      success_url:`${SITE_URL}/modules/raffle/success.html?session_id={CHECKOUT_SESSION_ID}&success=1`,
      cancel_url:`${SITE_URL}/modules/raffle/?canceled=1`,
      line_items:[{price_data:{currency:'usd',product_data:{name:'Raffle Entry'},unit_amount:PRICE_PER_ENTRY},quantity:entries}],
      metadata:{userId,entriesPurchased:String(entries)}
    });
    res.json({url:session.url});
  }catch(err){console.error(err); res.status(500).json({error:'Internal error'})}
});

app.post('/api/stripe/webhook',express.raw({type:'application/json'}),(req,res)=>{
  const sig = req.headers['stripe-signature'];
  let event;
  try{
    if(!stripe) return res.status(501).json({error:'Stripe not configured'});
    if(sig && STRIPE_WEBHOOK_SECRET){
      event = stripe.webhooks.constructEvent(req.body,sig,STRIPE_WEBHOOK_SECRET);
      if(event.type==='checkout.session.completed'){
        const session = event.data.object;
        const userId = session.metadata?.userId || session.customer_email || '';
        const total = Number(session.amount_total||0);
        const entries = total?Math.max(1,Math.round(total/PRICE_PER_ENTRY)):1;
        if(userId && entries>0){
          const db = readDb();
          db.tickets[userId]=(db.tickets[userId]||0)+entries;
          db.payments.push({paymentId:'pay_'+Math.random().toString(36).slice(2,10),userId,entries,amount:total,timestamp:new Date().toISOString(),source:'stripe_test'});
          writeDb(db);
        }
      }
    }
    res.status(200).json({received:true});
  }catch(err){console.error(err); res.status(400).json({error:'Webhook error',message:err?.message||String(err)})}
});

// ---------- Users ----------
app.get('/api/users',(req,res)=>res.json({users:Object.values(readDb().users||{})}));
app.get('/api/users/:id',(req,res)=>{
  const db = readDb();
  const id = String(req.params.id||'').trim();
  const fromUsers = db.users[id];
  const fromCredits = db.credits[id]||0;
  const fromTickets = db.tickets[id]||0;
  const user = fromUsers||{id,credits:fromCredits,raffleTickets:fromTickets};
  db.users[id]=user;
  writeDb(db);
  res.json(user);
});

// ---------- Start ----------
app.listen(PORT,()=>console.log(`✅ Local & Prod API running at ${SITE_URL}`));
