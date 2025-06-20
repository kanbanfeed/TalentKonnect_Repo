import React, { useState, useEffect } from 'react';
import { Copy, Check, Users, Award, Share2, Gift, TrendingUp, ExternalLink } from 'lucide-react';

const ReferralModule = () => {
  // State management
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [totalCreditsEarned, setTotalCreditsEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentReferrals, setRecentReferrals] = useState([]);

  // Mock API - GET /api/referrals/link
  const fetchReferralLink = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate unique link (in real app, this would come from backend)
    const userId = 'user123';
    const link = `https://talentkonnect.com/invite/${userId}`;
    
    setReferralLink(link);
  };

  // Mock API - GET /api/referrals/count
  const fetchReferralCount = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = {
      count: 7,
      totalCreditsEarned: 7,
      recentReferrals: [
        { name: 'Alex M.', date: Date.now() - 86400000, status: 'active' }, // 1 day ago
        { name: 'Sarah K.', date: Date.now() - 172800000, status: 'active' }, // 2 days ago
        { name: 'Mike R.', date: Date.now() - 259200000, status: 'pending' }, // 3 days ago
        { name: 'Lisa P.', date: Date.now() - 432000000, status: 'active' }, // 5 days ago
        { name: 'Tom W.', date: Date.now() - 604800000, status: 'active' }, // 1 week ago
      ]
    };
    
    setReferralCount(mockData.count);
    setTotalCreditsEarned(mockData.totalCreditsEarned);
    setRecentReferrals(mockData.recentReferrals);
  };

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchReferralLink(),
        fetchReferralCount()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Handle copy link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Show success feedback
      console.log('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Share via Web Share API (if supported)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TalentKonnect',
          text: 'Turn your everyday expertise into earnings! Join me on TalentKonnect for quick micro-tasks and skill sharing.',
          url: referralLink
        });
      } catch (err) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    const diff = Date.now() - timestamp;
    const days = Math.floor(diff / 86400000);
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{ backgroundColor: '#F1FAEE' }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                   style={{ backgroundColor: '#1D3557' }}>
                TK
              </div>
              <div>
                <h1 className="text-xl font-bold">
                  <span style={{ color: '#1D3557' }}>talent</span>
                  <span style={{ color: '#E76F51' }}>konnect</span>
                </h1>
                <p className="text-sm text-gray-500">Referral Program</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-white font-semibold"
                 style={{ backgroundColor: '#E76F51' }}>
              <Award className="w-4 h-4" />
              <span>{totalCreditsEarned} Credits Earned</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          // Loading State
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#1D3557' }}>
                Invite Friends & Earn Credits
              </h2>
              <p className="text-lg text-gray-600 mb-4">
                Share your unique link and earn +1 credit for each friend who joins!
              </p>
              
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl p-4 shadow-sm"
                     style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full"
                       style={{ backgroundColor: '#E76F51', color: 'white' }}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: '#1D3557' }}>{referralCount}</div>
                  <div className="text-sm text-gray-600">Friends Invited</div>
                </div>
                
                <div className="bg-white rounded-xl p-4 shadow-sm"
                     style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full"
                       style={{ backgroundColor: '#10B981', color: 'white' }}>
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: '#1D3557' }}>{totalCreditsEarned}</div>
                  <div className="text-sm text-gray-600">Credits Earned</div>
                </div>
                
                <div className="bg-white rounded-xl p-4 shadow-sm"
                     style={{ boxShadow: '2px 2px 0px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                  <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full"
                       style={{ backgroundColor: '#3B82F6', color: 'white' }}>
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: '#1D3557' }}>
                    {referralCount > 0 ? Math.round((totalCreditsEarned / referralCount) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            </div>

            {/* Referral Link Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm"
                 style={{ 
                   boxShadow: '2px 2px 0px rgba(0,0,0,0.05)',
                   borderRadius: '12px'
                 }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Personal Invite Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={referralLink}
                      readOnly
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      style={{ borderRadius: '8px' }}
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm transition-all hover:scale-105"
                      style={{
                        backgroundColor: copied ? '#10B981' : '#E76F51',
                        color: 'white',
                        borderRadius: '8px'
                      }}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex items-center space-x-2 px-4 py-3 rounded-lg font-medium text-sm border-2 transition-all hover:scale-105"
                      style={{
                        borderColor: '#E76F51',
                        color: '#E76F51',
                        borderRadius: '8px'
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Referral Status */}
                <div className="flex items-center justify-between p-4 rounded-lg"
                     style={{ backgroundColor: '#F1FAEE' }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: '#E76F51' }}>
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: '#1D3557' }}>
                        You've invited {referralCount} friends
                      </p>
                      <p className="text-sm text-gray-600">
                        Earned {totalCreditsEarned} credits from referrals
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Next milestone</p>
                    <p className="font-semibold" style={{ color: '#E76F51' }}>
                      {10 - referralCount} more invites
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-white rounded-xl p-6 shadow-sm"
                 style={{ 
                   boxShadow: '2px 2px 0px rgba(0,0,0,0.05)',
                   borderRadius: '12px'
                 }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#1D3557' }}>
                How Referrals Work
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <Share2 className="w-8 h-8" style={{ color: '#3B82F6' }} />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">1. Share Your Link</h4>
                  <p className="text-sm text-gray-600">Copy and share your unique invite link with friends via social media, email, or messaging apps.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <Users className="w-8 h-8" style={{ color: '#10B981' }} />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">2. Friend Joins</h4>
                  <p className="text-sm text-gray-600">Your friend signs up using your link and completes their first task or tip.</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                    <Award className="w-8 h-8" style={{ color: '#E76F51' }} />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">3. Earn Credits</h4>
                  <p className="text-sm text-gray-600">Get +1 credit automatically added to your account for each successful referral.</p>
                </div>
              </div>
            </div>

            {/* Recent Referrals */}
            {recentReferrals.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm"
                   style={{ 
                     boxShadow: '2px 2px 0px rgba(0,0,0,0.05)',
                     borderRadius: '12px'
                   }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#1D3557' }}>
                  Recent Referrals
                </h3>
                
                <div className="space-y-3">
                  {recentReferrals.map((referral, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold">
                          {referral.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{referral.name}</p>
                          <p className="text-sm text-gray-500">{formatDate(referral.date)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          referral.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {referral.status === 'active' ? '✓ Active' : '⏳ Pending'}
                        </span>
                        {referral.status === 'active' && (
                          <div className="flex items-center space-x-1 text-xs" style={{ color: '#E76F51' }}>
                            <Award className="w-3 h-3" />
                            <span>+1</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                  View All Referrals
                </button>
              </div>
            )}

            {/* Bonus Information */}
            <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-6 border"
                 style={{ borderRadius: '12px' }}>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6" style={{ color: '#E76F51' }} />
                </div>
                <div>
                  <h4 className="font-semibold mb-2" style={{ color: '#1D3557' }}>
                    Referral Bonus Tips
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• Credits from referrals count toward raffle entries</li>
                    <li>• Use credits for instant rewards in the marketplace</li>
                    <li>• Invite 10+ friends to unlock exclusive bonus rewards</li>
                    <li>• Your friend also gets 2 bonus credits for joining!</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Social Sharing Ideas */}
            <div className="bg-white rounded-xl p-6 shadow-sm"
                 style={{ 
                   boxShadow: '2px 2px 0px rgba(0,0,0,0.05)',
                   borderRadius: '12px'
                 }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: '#1D3557' }}>
                Share Ideas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-2">Social Media</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    "Just found this amazing platform for quick micro-tasks! Earning credits while helping others. Join me!"
                  </p>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                      Facebook
                    </button>
                    <button className="px-3 py-1 text-xs rounded-full bg-sky-100 text-sky-800 hover:bg-sky-200 transition-colors">
                      Twitter
                    </button>
                    <button className="px-3 py-1 text-xs rounded-full bg-pink-100 text-pink-800 hover:bg-pink-200 transition-colors">
                      Instagram
                    </button>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold mb-2">Direct Message</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    "Hey! I'm using TalentKonnect to turn my skills into earnings with quick 5-15 min tasks. Want to try it?"
                  </p>
                  <div className="flex space-x-2">
                    <button className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                      WhatsApp
                    </button>
                    <button className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors">
                      Discord
                    </button>
                    <button className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors">
                      Email
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center py-8">
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#1D3557' }}>
                Ready to Start Earning?
              </h3>
              <p className="text-gray-600 mb-6">
                Copy your link above and start inviting friends today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleCopyLink}
                  className="px-6 py-3 rounded-lg font-medium text-white transition-all hover:scale-105"
                  style={{ backgroundColor: '#E76F51', borderRadius: '8px' }}
                >
                  Copy Link Now
                </button>
                <button
                  onClick={handleShare}
                  className="px-6 py-3 rounded-lg font-medium border-2 transition-all hover:scale-105"
                  style={{ 
                    borderColor: '#1D3557',
                    color: '#1D3557',
                    borderRadius: '8px'
                  }}
                >
                  Share with Friends
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReferralModule;
