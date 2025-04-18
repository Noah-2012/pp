async function loadProjects() {
    const token = document.getElementById("token").value;
    const headers = {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json"
    };

    const repoOwner = "noah-2012";
    const repoName = "datahole-data";
    const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/repos`;

    const container = document.getElementById("project-list");
    container.innerHTML = "<p>Lade Projekte...</p>";

    try {
        const response = await fetch(apiUrl, { headers });
        const folders = await response.json();

        container.innerHTML = "";

        for (const folder of folders) {
            if (folder.type === "dir") {
                const metadataUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/repos/${folder.name}/metadata.xml`;
                const res = await fetch(metadataUrl, { headers });

                if (!res.ok) continue;

                const file = await res.json();
                const decoded = atob(file.content);
                const xml = new DOMParser().parseFromString(decoded, "text/xml");

                const name = xml.querySelector("name")?.textContent || folder.name;
                const author = xml.querySelector("author")?.textContent || "Unbekannt";
                const desc = xml.querySelector("description")?.textContent || "";
                const version = xml.querySelector("version")?.textContent || "";

                const el = document.createElement("div");
                el.className = "project";
                el.innerHTML = `
                    <h2>${name}</h2>
                    <p>${desc}</p>
                    <small>Version: ${version} – Autor: ${author}</small>
                `;
                container.appendChild(el);
            }
        }
    } catch (err) {
        container.innerHTML = "<p>❌ Fehler beim Laden der Projekte.</p>";
        console.error(err);
    }
}
