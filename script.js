// Campora — static prototype. All data below is sample data for demonstration.
// There is no backend: posts you write are added to this page only and are lost on refresh.

const samplePosts = [
  {
    author: "Ananya Sharma",
    meta: "CSE · 2nd Year · 2h ago",
    text: "The library finally has the new seating area on the 2nd floor. Best spot on campus to study before mid-sems — quiet, good light, and charging points at every table. 📚",
    likes: 24,
  },
  {
    author: "Rohit Verma",
    meta: "Mechanical · 3rd Year · 5h ago",
    text: "Our robotics club just finished the line-follower bot for the tech fest. Testing it in the main ground tomorrow at 4 PM — come watch if you're around! 🤖",
    likes: 41,
  },
  {
    author: "Sneha Patel",
    meta: "ECE · 1st Year · Yesterday",
    text: "First hackathon experience done! Didn't win, but learned more in 24 hours than in a whole month of classes. Already waiting for the next one. 💻",
    likes: 18,
  },
];

const sampleEvents = [
  { day: "02", mon: "Nov", name: "Annual Tech Fest — Day 1", meta: "Main Auditorium · 10 AM onwards" },
  { day: "08", mon: "Nov", name: "Inter-College Cricket Match", meta: "College Ground · 9 AM" },
  { day: "15", mon: "Nov", name: "AI & ML Workshop", meta: "Seminar Hall B · 11 AM" },
];

function initials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function createPostElement(post) {
  const article = document.createElement("article");
  article.className = "card post";

  const head = document.createElement("div");
  head.className = "post-head";
  head.innerHTML = `
    <span class="avatar">${initials(post.author)}</span>
    <span>
      <span class="post-author">${post.author}</span><br />
      <span class="post-meta">${post.meta}</span>
    </span>`;

  const text = document.createElement("p");
  text.className = "post-text";
  text.textContent = post.text;

  const actions = document.createElement("div");
  actions.className = "post-actions";
  const likeBtn = document.createElement("button");
  likeBtn.type = "button";
  likeBtn.className = "action-btn";
  let likes = post.likes;
  let liked = false;
  likeBtn.textContent = `♥ ${likes}`;
  likeBtn.addEventListener("click", () => {
    liked = !liked;
    likes += liked ? 1 : -1;
    likeBtn.textContent = `♥ ${likes}`;
    likeBtn.classList.toggle("liked", liked);
  });
  const commentBtn = document.createElement("button");
  commentBtn.type = "button";
  commentBtn.className = "action-btn";
  commentBtn.textContent = "💬 Comment";
  commentBtn.addEventListener("click", () => alert("Comments are planned, not built yet — this is a work-in-progress prototype."));
  actions.append(likeBtn, commentBtn);

  article.append(head, text, actions);
  return article;
}

function renderFeed() {
  const feed = document.getElementById("feed");
  feed.innerHTML = "";
  samplePosts.forEach((post) => feed.appendChild(createPostElement(post)));
}

function renderEvents() {
  const list = document.getElementById("eventList");
  sampleEvents.forEach((event) => {
    const li = document.createElement("li");
    li.className = "event";
    li.innerHTML = `
      <span class="event-date"><span class="day">${event.day}</span><span class="mon">${event.mon}</span></span>
      <span>
        <span class="event-name">${event.name}</span><br />
        <span class="event-meta">${event.meta}</span>
      </span>`;
    list.appendChild(li);
  });
}

document.getElementById("postBtn").addEventListener("click", () => {
  const input = document.getElementById("postInput");
  const text = input.value.trim();
  if (!text) return;
  const feed = document.getElementById("feed");
  feed.prepend(createPostElement({ author: "You", meta: "Just now · Sample post", text, likes: 0 }));
  input.value = "";
});

renderFeed();
renderEvents();
