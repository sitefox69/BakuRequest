let searchTimer = null;

function getViewerName() {
    const input = document.querySelector("#viewer-name");

    if (!input) {
        return "";
    }

    return input.value.trim();
}


function showSearchMessage(message, isError = false) {
    const element = document.querySelector("#search-message");

    if (!element) {
        return;
    }

    element.textContent = message;

    if (isError) {
        element.dataset.error = "true";
    } else {
        element.removeAttribute("data-error");
    }
}


function clearSearchMessage() {
    const element = document.querySelector("#search-message");

    if (!element) {
        return;
    }

    element.textContent = "";
    element.removeAttribute("data-error");
}


async function searchSongs() {
    const input = document.querySelector("#song-search");
    const resultsContainer = document.querySelector("#search-results");

    if (!input || !resultsContainer) {
        return;
    }

    const query = input.value.trim();

    if (!query) {
        resultsContainer.innerHTML = "";

        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "Wpisz tytuł lub wykonawcę.";
        resultsContainer.appendChild(empty);

        return;
    }

    try {
        clearSearchMessage();

        resultsContainer.innerHTML = "";

        const loading = document.createElement("div");
        loading.className = "empty";
        loading.textContent = "Wyszukiwanie...";
        resultsContainer.appendChild(loading);

        const response = await apiRequest(
            `/sr/search?q=${encodeURIComponent(query)}`
        );

        renderSearchResults(response.results || []);

    } catch (error) {
        console.error(
            "Nie udało się wyszukać utworów:",
            error
        );

        resultsContainer.innerHTML = "";

        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "Nie udało się wykonać wyszukiwania.";
        resultsContainer.appendChild(empty);

        showSearchMessage(
            error.message,
            true
        );
    }
}


function renderSearchResults(results) {
    const container = document.querySelector("#search-results");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!results.length) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "Nie znaleziono utworów.";
        container.appendChild(empty);
        return;
    }

    results.forEach(song => {

        const item = document.createElement("div");
        item.className = "queue-item";


        const info = document.createElement("div");
        info.className = "queue-info";


        const thumbnail = document.createElement("img");

        thumbnail.src = song.thumbnail || "";
        thumbnail.alt = "";
        thumbnail.className = "search-thumbnail";


        const text = document.createElement("div");


        const title = document.createElement("div");
        title.className = "queue-title";
        title.textContent =
            song.title || "Nieznany tytuł";


        const artist = document.createElement("div");
        artist.className = "queue-artist";
        artist.textContent =
            song.artist || "Nieznany wykonawca";


        text.appendChild(title);
        text.appendChild(artist);


        info.appendChild(thumbnail);
        info.appendChild(text);


        const actions = document.createElement("div");
        actions.className = "queue-actions";


        const button = document.createElement("button");

        button.type = "button";
        button.textContent = "DODAJ";
        button.title = "Dodaj utwór do kolejki";


        button.addEventListener(
            "click",
            async () => {
                await addSongToQueue(song);
            }
        );


        actions.appendChild(button);


        item.appendChild(info);
        item.appendChild(actions);


        container.appendChild(item);
    });
}


async function addSongToQueue(song) {
    const viewerName = getViewerName();

    if (!viewerName) {
        showSearchMessage(
            "Najpierw wpisz nazwę użytkownika.",
            true
        );

        const input = document.querySelector("#viewer-name");

        if (input) {
            input.focus();
        }

        return;
    }


    try {

        showSearchMessage(
            "Dodawanie utworu..."
        );


        await requestSong(
            song.id,
            viewerName
        );


        showSearchMessage(
            "Utwór został dodany do kolejki."
        );


        await refreshQueue();


    } catch (error) {

        console.error(
            "Nie udało się dodać utworu:",
            error
        );


        let message = error.message;


        if (message === "user_banned") {
            message =
                "Użytkownik jest zbanowany.";
        }

        if (message === "user_timed_out") {
            message =
                "Użytkownik ma aktywny timeout.";
        }

        if (message === "song_banned") {
            message =
                "Ten utwór jest zbanowany.";
        }

        showSearchMessage(
            message,
            true
        );
    }
}


function startViewer() {

    const searchButton =
        document.querySelector(
            "#song-search-button"
        );


    const searchInput =
        document.querySelector(
            "#song-search"
        );


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            searchSongs
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {
                    event.preventDefault();
                    searchSongs();
                }

            }
        );


        searchInput.addEventListener(
            "input",
            () => {

                clearTimeout(searchTimer);

                searchTimer = setTimeout(
                    () => {
                        if (
                            searchInput.value.trim().length >= 2
                        ) {
                            searchSongs();
                        }
                    },
                    500
                );

            }
        );

    }

}


document.addEventListener(
    "DOMContentLoaded",
    () => {
        startViewer();
    }
);
