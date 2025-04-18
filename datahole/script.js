document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("project-list");

    fetch('repos/')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = Array.from(doc.querySelectorAll('a'))
                .map(a => a.getAttribute('href'))
                .filter(href => href && !href.startsWith('../')); // Nur Unterordner

            links.forEach(folder => {
                const metadataPath = `repos/${folder}/metadata.xml`;

                fetch(metadataPath)
                    .then(res => res.text())
                    .then(xmlText => {
                        const xml = new DOMParser().parseFromString(xmlText, 'text/xml');
                        const name = xml.querySelector('name')?.textContent || 'Unbenannt';
                        const author = xml.querySelector('author')?.textContent || 'Unbekannt';
                        const desc = xml.querySelector('description')?.textContent || '';
                        const version = xml.querySelector('version')?.textContent || '';

                        const projectEl = document.createElement('div');
                        projectEl.className = 'project';
                        projectEl.innerHTML = `
                            <a href="repos/${folder}">
                                <h2>${name}</h2>
                                <p>${desc}</p>
                                <span>Version ${version} – von ${author}</span>
                            </a>
                        `;
                        container.appendChild(projectEl);
                    })
                    .catch(err => console.warn(`Keine metadata.xml in ${folder}`, err));
            });
        })
        .catch(err => {
            console.error("Konnte repos/ nicht laden", err);
        });
});

