const mockItems = [
    {
        id: 1,
        content: "Use a whiteboard to visualize daily tasks.",
        tags: ["productivity", "tips"],
        category: "general",
        pending: true
    },
    {
        id: 2,
        content: "Schedule a 5-min break every hour.",
        tags: ["wellness"],
        category: "general",
        pending: false
    }
];

function createSubmissionItem(item) {
    const card = document.createElement("div");
    card.className = "submission-card";
    if (item.pending) {
        card.classList.add("highlight");
    }

    // Text content
    const text = document.createElement("p");
    text.className = "submission-text";
    text.textContent = item.content;
    card.appendChild(text);

    // Tags section
    const tagSection = document.createElement("div");
    tagSection.className = "tag-section";

    const tagLabel = document.createElement("p");
    tagLabel.textContent = "Suggested Tags:";
    tagSection.appendChild(tagLabel);

    const tagContainer = document.createElement("div");
    tagContainer.className = "tags";

    item.tags.forEach(tag => {
        const tagEl = document.createElement("span");
        tagEl.className = "tag";
        tagEl.textContent = tag;
        tagContainer.appendChild(tagEl);
    });
    tagSection.appendChild(tagContainer);

    // Dropdown for category
    const select = document.createElement("select");
    ["general", "creative", "productivity", "learning"].forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
        if (item.category === opt) option.selected = true;
        select.appendChild(option);
    });

    select.addEventListener("change", async (e) => {
        const newCategory = e.target.value;        
        try {
            const res = await fetch(`api/admin/clusters/${item.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ category: newCategory })
            });
            // After successful fetch
            const successMark = document.createElement("span");
            successMark.textContent = "Suceessfully fetched";
            successMark.classList.add("save-feedback");
            select.parentNode.appendChild(successMark);

            setTimeout(() => successMark.remove(), 1500);

            if (!res.ok) {
                throw new Error('Failed to save');
            }

            console.log(`Saved item ${item.id} with category: ${newCategory}`);

        } catch (error) {
            console.error(`Error saving item ${item.id}:`, error);
            alert('Something went wrong while saving!');
        }
    });



    tagSection.appendChild(select);
    card.appendChild(tagSection);

    return card;
}

function renderItems() {
    const container = document.getElementById("itemList");
    container.innerHTML = ""; // clear previous

    mockItems.forEach(item => {
        const card = createSubmissionItem(item);
        container.appendChild(card);
    });
}

// Call on load
renderItems();

document.getElementById("approveAllBtn").addEventListener("click", async () => {
    const pendingItems = mockItems.filter(item => item.pending);

    for (let item of pendingItems) {
        try {
            const res = await fetch(`api/admin/clusters/${item.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pending: false }) // assuming this marks it reviewed
            });
            const notice = document.createElement("div");
            notice.textContent = "All items approved!";
            notice.className = "action-feedback";
            document.body.appendChild(notice);

            setTimeout(() => notice.remove(), 2000);

            if (!res.ok) throw new Error("Failed");

            // update local state
            item.pending = false;
        } catch (err) {
            console.error(`Error approving item ${item.id}`, err);
        }
    }

    renderItems();
});

document.getElementById("reassignBtn").addEventListener("click", async () => {
    const newCategory = prompt("Enter new category: general, creative, productivity, learning");

    if (!["general", "creative", "productivity", "learning"].includes(newCategory)) {
        alert("Invalid category");
        return;
    }

    for (let item of mockItems) {
        try {
            const res = await fetch(`api/admin/clusters/${item.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: newCategory })
            });

            if (!res.ok) throw new Error("Failed");

            item.category = newCategory;
        } catch (err) {
            console.error(`Error reassigning item ${item.id}`, err);
        }
    }

    renderItems(); 
});

