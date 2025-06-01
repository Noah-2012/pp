document.addEventListener('DOMContentLoaded', function() {
    const username = 'noah-2012';
    const repoName = 'pp';
    const reposContainer = document.getElementById('repos');
    const titleContainer = document.getElementById('titleContainer');
    const readmeContainer = document.getElementById('readmeContainer');
    const homeTab = document.getElementById('homeTab');
    const aboutMeTab = document.getElementById('aboutMeTab');
    const aboutMeContainer = document.getElementById('aboutMeContainer');
    const futureProjectsTab = document.getElementById('futureProjectsTab');
    const futureProjectsContainer = document.getElementById('futureProjectsContainer');
    const clockElement = document.getElementById('clock');
    const repoActions = document.getElementById('repoActions');

    // Neue Elemente für die Sidebar
    const sidebar = document.getElementById('mySidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');

    // Überprüfen, ob alle benötigten Elemente vorhanden sind
    if (!reposContainer || !titleContainer || !readmeContainer || !homeTab || 
        !aboutMeTab || !aboutMeContainer || !futureProjectsTab || 
        !futureProjectsContainer || !clockElement || !repoActions ||
        !sidebar || !sidebarToggle) { // Neue Überprüfung
        console.error('Ein oder mehrere erforderliche DOM-Elemente fehlen');
        return;
    }

    // Uhrfunktion
    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        clockElement.textContent = `${hours}:${minutes}:${seconds}`;
    }
    
    setInterval(updateClock, 1000);
    updateClock();

    // Tab-Switching
    homeTab.addEventListener('click', resetToHome);
    aboutMeTab.addEventListener('click', loadAboutMe);
    futureProjectsTab.addEventListener('click', loadFutureProjects);

    // Sidebar Ein-/Ausklappen Funktionalität
    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('collapsed');
    });

    // Lade GitHub Repositories
    function fetchRepositories() {
        fetch(`https://api.github.com/users/${username}/repos`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(repos => {
                if (!Array.isArray(repos)) {
                    throw new Error('Invalid response format');
                }
                
                reposContainer.innerHTML = '';
                
                repos.forEach(repo => {
                    if (!repo.name) return;
                    
                    const repoItem = document.createElement('li');
                    repoItem.className = 'repo-item';
                    
                    const repoNameElement = document.createElement('p');
                    repoNameElement.className = 'repo-name';
                    repoNameElement.textContent = repo.name;
                    
                    repoItem.appendChild(repoNameElement);
                    reposContainer.appendChild(repoItem);

                    repoItem.addEventListener('click', () => {
                        showRepoDetails(repo.name);
                        setActiveTab(null);
                    });
                });
            })
            .catch(error => {
                console.error('Fehler beim Laden der Repositories:', error);
                reposContainer.innerHTML = '<li>Projekte konnten nicht geladen werden. Bitte versuche es später erneut.</li>';
            });
    }

    function showRepoDetails(repoName) {
        if (!repoName) return;
        
        titleContainer.classList.add('title-moved-up');
        readmeContainer.style.display = 'block';
        aboutMeContainer.style.display = 'none';
        futureProjectsContainer.style.display = 'none';

        fetch(`https://api.github.com/repos/${username}/${repoName}/readme`, {
            headers: {
                'Accept': 'application/vnd.github.v3.raw'
            }
        })
            .then(response => {
                if (!response.ok) throw new Error('README nicht gefunden');
                return response.text();
            })
            .then(text => {
                readmeContainer.innerHTML = `<h2>${repoName}</h2><hr>` + 
                    (window.marked ? marked.parse(text) : text);
            })
            .catch(() => {
                readmeContainer.innerHTML = 
                    `<p class="error-message">Kein README oder Fehler 404</p>`;
            });
        
        updateDownloadButton(repoName);
    }

    async function loadAboutMe() {
        titleContainer.classList.add('title-moved-up');
        aboutMeContainer.style.display = 'block';
        readmeContainer.style.display = 'none';
        futureProjectsContainer.style.display = 'none';
        setActiveTab(aboutMeTab);

        try {
            const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/scripts/about_me.md`, {
                headers: {
                    'Accept': 'application/vnd.github.v3.raw'
                }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    aboutMeContainer.innerHTML = `
                        <div class="error-message">
                            <h3>About Me Datei nicht gefunden</h3>
                            <p>Bitte erstellen Sie eine 'about_me.md' im 'scripts'-Ordner.</p>
                            <p>Der Pfad sollte sein: <code>${username}/${repoName}/scripts/about_me.md</code></p>
                            <a href="https://github.com/${username}/${repoName}/new/main?filename=scripts/about_me.md" 
                               target="_blank"
                               style="color: #58a6ff;">
                               Hier Datei erstellen
                            </a>
                        </div>`;
                } else {
                    throw new Error(`API Error: ${response.status}`);
                }
                return;
            }

            const text = await response.text();
            aboutMeContainer.innerHTML = window.marked ? marked.parse(text) : text;
        } catch (error) {
            console.error('Fehler beim Laden der About Me Datei:', error);
            aboutMeContainer.innerHTML = `
                <div class="error-message">
                    <p>About Me konnte nicht geladen werden.</p>
                    <p><small>${error.message}</small></p>
                </div>`;
        }
    }

    async function loadFutureProjects() {
        titleContainer.classList.add('title-moved-up');
        futureProjectsContainer.style.display = 'block';
        readmeContainer.style.display = 'none';
        aboutMeContainer.style.display = 'none';
        setActiveTab(futureProjectsTab);

        try {
            const response = await fetch(`https://api.github.com/repos/${username}/${repoName}/contents/projects`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    futureProjectsContainer.innerHTML = `
                        <div class="error-message">
                            <h3>Ordner 'projects' nicht gefunden</h3>
                            <p>Bitte erstellen Sie einen 'projects'-Ordner im Hauptverzeichnis Ihres Repository.</p>
                            <p>Der Pfad sollte sein: <code>${username}/${repoName}/projects/</code></p>
                            <a href="https://github.com/${username}/${repoName}/new/main?filename=projects/beispiel.txt" 
                               target="_blank"
                               style="color: #58a6ff;">
                               Hier Ordner erstellen
                            </a>
                        </div>`;
                } else {
                    throw new Error(`API Error: ${response.status}`);
                }
                return;
            }

            const files = await response.json();
            futureProjectsContainer.innerHTML = '<h2>Future Projects</h2>';

            if (!Array.isArray(files)) {
                throw new Error('Ungültige API-Antwort');
            }

            const txtFiles = files.filter(file => file.name && file.name.toLowerCase().endsWith('.txt'));
            
            if (txtFiles.length === 0) {
                futureProjectsContainer.innerHTML += '<p>Keine .txt-Dateien im projects-Ordner gefunden</p>';
                return;
            }

            for (const file of txtFiles) {
                try {
                    if (!file.download_url) continue;
                    
                    const contentResponse = await fetch(file.download_url);
                    if (!contentResponse.ok) continue;
                    
                    const content = await contentResponse.text();
                    const projectItem = document.createElement('div');
                    projectItem.className = 'project-item';
                    projectItem.innerHTML = `
                        <h3 class="project-title">${file.name.replace('.txt', '')}</h3>
                        <pre class="project-content">${escapeHtml(content)}</pre>
                    `;
                    futureProjectsContainer.appendChild(projectItem);
                } catch (error) {
                    console.error(`Fehler beim Laden von ${file.name}:`, error);
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der Future Projects:', error);
            futureProjectsContainer.innerHTML = `
                <div class="error-message">
                    <p>Future Projects konnten nicht geladen werden.</p>
                    <p><small>${error.message}</small></p>
                </div>`;
        }
    }

    function resetToHome() {
        titleContainer.classList.remove('title-moved-up');
        readmeContainer.style.display = 'none';
        aboutMeContainer.style.display = 'none';
        futureProjectsContainer.style.display = 'none';
        setActiveTab(homeTab);
        hideDownloadButton();
    }

    function setActiveTab(activeTab) {
        [homeTab, aboutMeTab, futureProjectsTab].forEach(tab => {
            tab.classList.remove('active');
        });
        
        if (activeTab) {
            activeTab.classList.add('active');
        }
    }

    function updateDownloadButton(repoName) {
        if (!repoName) return;
        
        repoActions.innerHTML = `
            <a href="https://github.com/${username}/${repoName}/archive/refs/heads/main.zip" 
               class="download-btn" 
               download>
               <i class="fas fa-download"></i> ${repoName} herunterladen (ZIP)
            </a>
            <a href="https://github.com/${username}/${repoName}" 
               class="github-link" 
               target="_blank" 
               rel="noopener noreferrer">
               <i class="fas fa-external-link-alt"></i> Auf GitHub ansehen
            </a>
        `;
        
        repoActions.classList.add('visible');
    }

    function hideDownloadButton() {
        repoActions.classList.remove('visible');
        setTimeout(() => {
            repoActions.innerHTML = '';
        }, 300);
    }

    // Hilfsfunktion zum Escapen von HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initialisierung
    fetchRepositories();
});
