/*
"Talk is cheap. Show me the code."
—Linus Torvalds
*/

// Palabas · WS1 TV Show Search code-along (TVmaze API, no key needed)
// Open DevTools (F12): keep the Console AND the Network tab open.
// Sample or live mode: see config.js.

// ---------- Given: page elements ----------
const form = document.getElementById("searchForm");
const input = document.getElementById("query");
const statusText = document.getElementById("status");
const results = document.getElementById("results");
const dialog = document.getElementById("details");
const detailsBody = document.getElementById("detailsBody");
const closeBtn = document.getElementById("closeDetails");
const modeBadge = document.getElementById("modeBadge");

// ---------- Given: the API's URLs ----------
const API = "https://api.tvmaze.com";

// Turns "Breaking Bad" into "breaking-bad" (used for the sample-data file names)
function slug(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// e.g. https://api.tvmaze.com/search/shows?q=breaking%20bad
function searchURL(query) {
  if (USE_SAMPLE_DATA) return `data/search/${slug(query)}.json`;
  return `${API}/search/shows?q=${encodeURIComponent(query)}`;
}

// e.g. https://api.tvmaze.com/shows/169
function showURL(id) {
  return USE_SAMPLE_DATA ? `data/shows/${id}.json` : `${API}/shows/${id}`;
}

// e.g. https://api.tvmaze.com/shows/169/cast
function castURL(id) {
  return USE_SAMPLE_DATA ? `data/cast/${id}.json` : `${API}/shows/${id}/cast`;
}

// e.g. https://api.tvmaze.com/shows/169/seasons
function seasonsURL(id) {
  return USE_SAMPLE_DATA ? `data/seasons/${id}.json` : `${API}/shows/${id}/seasons`;
}

// ---------- Given: helpers (no need to change) ----------

// Shows a message under the search box. type: "info", "loading" or "error"
function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.className = "status " + type;
}

// Makes an element with an optional class and text: el("span", "year", "2008")
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A poster <img>, or a placeholder when the show has no image (image is null)
function createPoster(show, size = "medium") {
  if (!show.image) {
    return el("span", "poster none", "No poster");
  }
  const img = el("img", "poster");
  img.src = show.image[size] || show.image.medium;
  img.alt = `Poster: ${show.name}`;
  img.loading = "lazy";
  img.addEventListener("error", () => img.replaceWith(el("span", "poster none", "No poster")));
  return img;
}

// "2008–2013", or "2016–" for a show that is still running
function yearRange(show) {
  const start = show.premiered ? show.premiered.slice(0, 4) : "?";
  const end = show.ended ? show.ended.slice(0, 4) : "";
  return `${start}–${end}`;
}

// TVmaze summaries contain HTML like "<p><b>Friends</b> follows…</p>".
// This keeps only the text. (Never put text from an API into innerHTML:
// if it contained a <script> or an onerror, it could run on your page.)
function stripTags(html) {
  if (!html) return "No summary yet.";
  return new DOMParser().parseFromString(html, "text/html").body.textContent;
}

// Close the details pop-up (Step 4) with the × button or by clicking outside it
closeBtn.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

// Show which mode we're in
modeBadge.textContent = USE_SAMPLE_DATA ? "Sample data" : "Live · TVmaze";
modeBadge.classList.toggle("live", !USE_SAMPLE_DATA);

// STEP 1 — Your first API request
// TODO: async function testRequest(): fetch searchURL("friends"), log the status and the JSON array
async function testRequest() {
  //Builds search url for the show "friends"
  const url = searchURL("friends");
  console.log("Request:", url); // live mode: open this URL in a new tab to see the raw JSON

  //Send the request and wait for a response from the server
  const response = await fetch(url); // 1st await: the response arrives
  console.log("Status:", response.status, "ok?", response.ok);

  //Converts the response to JSON format
  const data = await response.json(); // 2nd await: the body is read as JSON
  console.log(data); // an ARRAY of { score, show }
  console.log("How many:", data.length);
  console.log("First show:", data[0].show.name, data[0].show.premiered);
}

//Run the function
testRequest();


// STEP 2 — Search and show the results
// TODO: renderResults(items), searchShows(query), and a submit listener on the form

//This function will create and display the card results from seraching samples.
function renderResults(items) {
  //This will clear the results before displaying new results.
  results.innerHTML = " ";
  //This goes through every item found.
  items.forEach((item) => {
    //This will get the show information from each item.
    const show = item.show;
    //Will create new button.
    const card = el("button", "card");
    card.type = ("button");
    card.dataset.id = show.id;
    
    //This will get the rating of the show if it has one.
    const rating = show.rating?.average;
    //This adds all the information inside the card.
    card.append(
      createPoster(show),
      el("span", "title", show.name),
      el("span", "year", yearRange(show)),
      el("span", "genres", show.genres.join(", ")),
      el("span", "rating", rating ? `⭐ ${rating}` : "Not rated yet")
    )
    //This will add the card to the results section.
    results.appendChild(card);
  });
}

//This function will searches the api and shows what it found.
async function searchShows(query) {
    const url = searchURL(query);
    const response = await fetch(url);
    const data = await response.json();
    renderResults(data);
};

//This will listen for the submit event and will call the searchShows function with the input value.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (query === "") return;
  searchShows(query);
});


// STEP 3 — getJSON(): one careful helper for every request
// TODO: catch network errors, check 429 and response.ok; rewrite searchShows with try / catch and an empty-array check
// This function fetches JSON and handles every possible request error
async function getJSON(url) {
  let response;
  try {
    response = await fetch(url);
  } catch (networkError) {
    // fetch only rejects when there is NO answer at all: offline, blocked, server down
    throw new Error("Can't reach TVmaze. Check your internet, or set USE_SAMPLE_DATA = true in config.js.");
  }

  if (response.status === 429) {
    // TVmaze allows about 20 requests every 10 seconds per internet connection
    throw new Error("Too many requests (429). Wait 10 seconds and try again.");
  }
  if (!response.ok) {
    throw new Error(
      USE_SAMPLE_DATA
        ? "Sample mode only knows: friends, office, breaking bad, stranger things, sherlock, thrones, sample."
        : `Request failed (HTTP ${response.status}).`
    );
  }
  return response.json();
}

// (this replaces the Step 2 searchShows)
async function searchShows(query) {
  setStatus(`Searching for "${query}"…`, "loading");
  results.innerHTML = "";

  try {
    const data = await getJSON(searchURL(query));

    // An empty array is NOT an error to fetch (HTTP 200). We must check it.
    if (data.length === 0) {
      setStatus(`No shows found for "${query}". Check the spelling.`, "error");
      return;
    }
    renderResults(data);
    setStatus(`${data.length} ${data.length === 1 ? "show" : "shows"} found for "${query}"`);
  } catch (error) {
    setStatus(error.message, "error");
  }
}


//STEP 4 — Click a show to see its details
// TODO: one click listener on #results, showDetails(id), renderDetails(show)
results.addEventListener("click", (event) => {
  //This will find the clicked card
  const card = event.target.closest(".card");
  if (card) showDetails(card.dataset.id);
});

//This function loads the selected show's full detailes and opens the pop up
async function showDetails(id) {
  detailsBody.replaceChildren(el("p", "status loading", "Loading details…"));
  dialog.showModal();

  try {
    //This fetches the single show data using the getJSON function
    const show = await getJSON(showURL(id));
    //This calls the rendrDetails to fill the pop-up if fetch failes
    renderDetails(show);
  } catch (error) {
    //This shows the error message in the pop-up if fetch failes
    detailsBody.replaceChildren(el("p", "status error", error.message));
  }
}

//This function builds the full details content for the pop-up and fills it with the show data
function renderDetails(show) {
  const where = show.network ? show.network.name : show.webChannel ? show.webChannel.name : "";
  const minutes = show.runtime || show.averageRuntime; // runtime is null when episodes vary

  const info = el("div", "info");
  info.append(
    el("h2", "", show.name),
    el("p", "meta", [yearRange(show), where, show.genres.join(", "), minutes ? `${minutes} min` : ""].filter(Boolean).join(" · ")),
    el("p", "score", show.rating.average ? `★ ${show.rating.average} / 10` : "Not rated yet"),
    el("p", "plot", stripTags(show.summary)) // text only, never innerHTML
  );

  const links = el("p", "links");
  const tvmaze = el("a", "", "View on TVmaze ↗");
  tvmaze.href = show.url;
  tvmaze.target = "_blank";
  links.append(tvmaze);
  info.append(links);

  detailsBody.replaceChildren(createPoster(show, "original"), info);
}


// STEP 5 — Promise.all: show + cast + seasons at the same time
// TODO: rewrite showDetails with Promise.all, and renderDetails(show, cast, seasons)
async function showDetails(id) {
  detailsBody.replaceChildren(el("p", "status loading", "Loading details…"));
  dialog.showModal();

  try {
    const start = performance.now();
    // Start all three requests now, then wait for ALL of them
    const [show, cast, seasons] = await Promise.all([
      getJSON(showURL(id)),
      getJSON(castURL(id)),
      getJSON(seasonsURL(id)),
    ]);
    console.log(`3 requests in ${Math.round(performance.now() - start)} ms`);
    renderDetails(show, cast, seasons);
  } catch (error) {
    // If ANY of the three fails, Promise.all rejects and we land here
    detailsBody.replaceChildren(el("p", "status error", error.message));
  }
}

function renderDetails(show, cast, seasons) {
  const where = show.network ? show.network.name : show.webChannel ? show.webChannel.name : "";
  const minutes = show.runtime || show.averageRuntime; // runtime is null when episodes vary
  const seasonText = seasons.length === 1 ? "1 season" : `${seasons.length} seasons`;

  const info = el("div", "info");
  info.append(
    el("h2", "", show.name),
    el("p", "meta", [yearRange(show), where, seasonText, minutes ? `${minutes} min` : ""].filter(Boolean).join(" · ")),
    el("p", "meta", show.genres.join(", ")),
    el("p", "score", show.rating.average ? `★ ${show.rating.average} / 10` : "Not rated yet"),
    el("p", "plot", stripTags(show.summary)) // text only, never innerHTML
  );

  // The first 6 cast members: "Bryan Cranston as Walter White"
  if (cast.length > 0) {
    const list = el("ul", "cast");
    cast.slice(0, 6).forEach((member) => {
      const li = el("li", "", member.person.name + " ");
      li.append(el("span", "", "as " + member.character.name));
      list.append(li);
    });
    info.append(el("h3", "", "Cast"), list);
  }

  const links = el("p", "links");
  const tvmaze = el("a", "", "View on TVmaze ↗");
  tvmaze.href = show.url;
  tvmaze.target = "_blank";
  links.append(tvmaze);
  info.append(links);

  detailsBody.replaceChildren(createPoster(show, "original"), info);
}

//Extra Feature: Sort by rating button
//This will sort the cards by rating when the button is clicked
const sortRatingBtn = document.getElementById("sortRatingBtn");

sortRatingBtn.addEventListener("click", () => {
  const allCards = Array.from(results.querySelectorAll(".card"));
  console.log("ALL CARDS:", allCards);

  //This wll get all the show cards
  allCards.forEach(card => {
    console.log("CARD RATING DATASET:", card.dataset.rating);
  });

  //This will sort the cards by their rating from highest to lowest
  const sortedCards = allCards.sort((cardA, cardB) => {
    const ratingA = Number(cardA.dataset.rating) || 0;
    const ratingB = Number(cardB.dataset.rating) || 0;
    return ratingB - ratingA;
  });

  //This will clear old cards then show sorted cards
  results.innerHTML = "";
  sortedCards.forEach(card => results.appendChild(card));
});

//Render each tv show as a cadrd
function renderResults(items) {
  results.innerHTML = "";

  //Loop trhough every show item
  items.forEach((item) => {
    const show = item.show;
    const card = el("button", "card");
    card.type = "button";
    card.dataset.id = show.id;
    card.dataset.rating = show.rating?.average ?? "0";

  //This will add details inside the cards
  card.append(
   createPoster(show),
    el("span", "title", show.name),
   el("span", "year", yearRange(show)),
    el("span", "genres", show.genres.join(", ")),
    el("span", "rating", `★ ${show.rating?.average ?? "No Rating"}`)
  );

  //This will put the finished card on the page
  results.appendChild(card);
  });
}