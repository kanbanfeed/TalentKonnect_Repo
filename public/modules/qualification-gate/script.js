const paidBtn = document.getElementById("paidBtn");
const freeBtn = document.getElementById("freeBtn");
const paidForm = document.getElementById("paidForm");
const freeForm = document.getElementById("freeForm");
const toast = document.getElementById("toast");

// Switch views
paidBtn.addEventListener("click", () => {
  paidForm.classList.remove("hidden");
  freeForm.classList.add("hidden");
});

freeBtn.addEventListener("click", () => {
  freeForm.classList.remove("hidden");
  paidForm.classList.add("hidden");
});

// Toast display
function showToast(message, isError = false) {
  toast.textContent = message;
  toast.style.backgroundColor = isError ? "#EF4444" : "#10B981";
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

// API call function
// async function submitQualification(data) {
//   try {
//     const response = await fetch("http://localhost:5000/api/qualify", {
//       method: "POST",
//       headers: { 
//         "Content-Type": "application/json" 
//       },
//       body: JSON.stringify(data)
//     });

//     const result = await response.json();
    
//     if (!response.ok) {
//       throw new Error(result.error || 'Submission failed');
//     }
    
//     return result;
//   } catch (error) {
//     throw error;
//   }
// }

// // Paid form submit
// paidForm.addEventListener("submit", async (e) => {
//   e.preventDefault();
  
//   const skill = document.getElementById("skill").value;
//   const fun = document.getElementById("fun").value;
//   const feedback = document.getElementById("feedback").value;

//   if (!skill || !fun || !feedback) {
//     showToast("Please complete all quiz questions", true);
//     return;
//   }

//   try {
//     const result = await submitQualification({
//       path: "paid",
//       skill,
//       fun,
//       feedback
//     });
    
//     showToast("Quiz submitted successfully");
//     console.log("Received token:", result.token);
//     paidForm.reset();
//   } catch (error) {
//     showToast(error.message || "Submission failed", true);
//   }
// });

// // Free form submit
// freeForm.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const inputs = Array.from(freeForm.querySelectorAll("input[required], textarea[required]"));
//   const allFilled = inputs.every(input => input.value.trim() !== "");

//   if (!allFilled) {
//     showToast("Please complete all fields", true);
//     return;
//   }

//   try {
//     // Collect form data
//     const formData = new FormData(freeForm);
//     const data = { path: "free" };
    
//     // Convert FormData to object
//     for (let [key, value] of formData.entries()) {
//       data[key] = value;
//     }

//     const result = await submitQualification(data);
    
//     showToast("Form submitted successfully");
//     console.log("Received token:", result.token);
//     freeForm.reset();
//   } catch (error) {
//     showToast(error.message || "Submission failed", true);
//   }
// });



// API call function (Vercel)
document.addEventListener('DOMContentLoaded', () => {
  const paidBtn = document.getElementById("paidBtn");
  const freeBtn = document.getElementById("freeBtn");
  const paidForm = document.getElementById("paidForm");
  const freeForm = document.getElementById("freeForm");
  const toast = document.getElementById("toast");

  // quick sanity
  console.log('[QG] init', { paidBtn: !!paidBtn, freeBtn: !!freeBtn, paidForm: !!paidForm, freeForm: !!freeForm, toast: !!toast });

  // Switch views
  if (paidBtn && freeBtn && paidForm && freeForm) {
    paidBtn.addEventListener("click", () => {
      paidForm.classList.remove("hidden");
      freeForm.classList.add("hidden");
    });

    freeBtn.addEventListener("click", () => {
      freeForm.classList.remove("hidden");
      paidForm.classList.add("hidden");
    });
  }

  // Toast display
  function showToast(message, isError = false) {
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = isError ? "#EF4444" : "#10B981";
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // ---- API base: Vite (5173) -> Vercel dev (3000) ----
  const API_BASE = location.hostname === "localhost" ? "http://localhost:3000" : "";
  // -----------------------------------------------------

  // API call function
  async function submitQualification(data) {
    const response = await fetch(`${API_BASE}/api/qualify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Submission failed');
    return result;
  }

  // Paid form submit
  if (paidForm) {
    paidForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // STOP full page reload
      const skill = document.getElementById("skill")?.value;
      const fun = document.getElementById("fun")?.value;
      const feedback = document.getElementById("feedback")?.value;

      if (!skill || !fun || !feedback) {
        showToast("Please complete all quiz questions", true);
        return;
      }

      try {
        const result = await submitQualification({ path: "paid", skill, fun, feedback });
        showToast("Quiz submitted successfully");
        console.log("Received token:", result.token);
        paidForm.reset();
      } catch (error) {
        showToast(error.message || "Submission failed", true);
      }
    });
  }

  // Free form submit
  if (freeForm) {
    freeForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // STOP full page reload

      const inputs = Array.from(freeForm.querySelectorAll("input[required], textarea[required]"));
      const allFilled = inputs.every(input => input.value.trim() !== "");

      if (!allFilled) {
        showToast("Please complete all fields", true);
        return;
      }

      try {
        const formData = new FormData(freeForm);
        const data = { path: "free" };
        for (let [key, value] of formData.entries()) data[key] = value;

        const result = await submitQualification(data);
        showToast("Form submitted successfully");
        console.log("Received token:", result.token);
        freeForm.reset();
      } catch (error) {
        showToast(error.message || "Submission failed", true);
      }
    });
  }
});
const tokenBox = document.getElementById("tokenBox");
if (tokenBox) {
  tokenBox.innerHTML = `Ticket created — <strong class="token">${result.token}</strong> (tier: ${result.tier})`;
  tokenBox.classList.add("show");
}
localStorage.setItem("qualificationToken", result.token);
localStorage.setItem("qualificationTier", result.tier);


const savedToken = localStorage.getItem("qualificationToken");
const savedTier = localStorage.getItem("qualificationTier");
if (savedToken) {
  const tokenBox = document.getElementById("tokenBox");
  if (tokenBox) {
    tokenBox.innerHTML = `🔁 Existing ticket — <strong class="token">${savedToken}</strong> (tier: ${savedTier || "n/a"})`;
    tokenBox.classList.add("show");
  }
}