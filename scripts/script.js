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
    // NEU: Benutzerdefinierter Marked.js Renderer für relative Bildpfade
    const githubMarkdownRenderer = new marked.Renderer();

    // Methode zum Überschreiben der Bildverarbeitung
    githubMarkdownRenderer.image = function(href, title, text) {
        // Überprüfen, ob href eine relative URL ist
        // Eine relative URL beginnt nicht mit 'http://', 'https://', '//' oder 'data:'
        const isRelative = href && !href.startsWith('http://') && 
                           !href.startsWith('https://') && 
                           !href.startsWith('//') &&
                           !href.startsWith('data:');

        let absoluteHref = href;

        if (isRelative) {
            // Beispiel: 'images/pic3.png' wird zu 'https://raw.githubusercontent.com/Noah-2012/repoName/main/images/pic3.png'
            // Wichtig: 'repoName' muss dynamisch gesetzt werden, daher übergeben wir es später.
            // Zuerst nur den Pfad erstellen, die Basis-URL wird später hinzugefügt.
            // Derzeitige Lösung: Wir müssen die Basis-URL dynamisch einfügen.
            // Dies ist ein Platzhalter, der in showRepoDetails ersetzt wird.
            absoluteHref = `__GITHUB_RAW_BASE_URL__/${href}`; 
        }

        let out = `<img src="${absoluteHref}" alt="${text}"`;
        if (title) {
            out += ` title="${title}"`;
        }
        out += '>';
        return out;
    };

    
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
                    if (!repo.name) return; // Überspringen, wenn kein Name vorhanden
                    
                    const repoItem = document.createElement('li');
                    repoItem.className = 'repo-item';
                    
                    const repoNameElement = document.createElement('p');
                    repoNameElement.className = 'repo-name';
                    repoNameElement.textContent = repo.name;
                    
                    repoItem.appendChild(repoNameElement);
                    reposContainer.appendChild(repoItem);

                    // Sprachen-Symbol hinzufügen
                    fetchRepoLanguage(repo.name, repoNameElement); // NEU: Sprache laden

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

    // Funktion zum Abrufen der meistgenutzten Sprache und Hinzufügen eines Symbols
    function fetchRepoLanguage(repoName, targetElement) {
        fetch(`https://api.github.com/repos/${username}/${repoName}/languages`)
            .then(response => {
                if (!response.ok) throw new Error('Could not fetch languages');
                return response.json();
            })
            .then(languages => {
                const totalBytes = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0);
                if (totalBytes === 0) return; // Keine Sprachen gefunden

                // Finde die Sprache mit den meisten Bytes
                let mostUsedLanguage = '';
                let maxBytes = 0;
                for (const lang in languages) {
                    if (languages[lang] > maxBytes) {
                        maxBytes = languages[lang];
                        mostUsedLanguage = lang;
                    }
                }

                if (mostUsedLanguage) {
                    const iconClass = getLanguageIconClass(mostUsedLanguage); // NEU: Icon-Klasse holen
                    if (iconClass) {
                        const langIcon = document.createElement('i');
                        langIcon.className = `language-icon ${iconClass}`; // Füge Icon-Klasse hinzu
                        langIcon.title = mostUsedLanguage; // Tooltip für den Namen
                        langIcon.style.color = getLanguageColor(mostUsedLanguage); // NEU: Farbe des Icons setzen
                        targetElement.appendChild(langIcon);
                    } else {
                        // Optional: Fallback zu einem Punkt oder Text, wenn kein Icon gefunden
                        const langSpan = document.createElement('span');
                        langSpan.className = 'language-icon language-dot'; // Eine Klasse für den Punkt-Fallback
                        langSpan.title = mostUsedLanguage;
                        langSpan.style.backgroundColor = getLanguageColor(mostUsedLanguage);
                        targetElement.appendChild(langSpan);
                    }
                }
            })
            .catch(error => {
                console.warn(`Fehler beim Laden der Sprache für ${repoName}:`, error);
                // Optional: Füge hier ein Standard-Symbol oder eine Fehlermeldung hinzu
            });
    }

    // NEU: Hilfsfunktion für Font Awesome Icon-Klassen der Programmiersprachen
    // Wichtig: 'fab' steht für Brand Icons, 'fas' für Solid Icons.
    // Nicht alle Sprachen haben ein spezifisches Brand-Icon in Font Awesome 5.
    function getLanguageIconClass(language) {
        switch (language.toLowerCase()) { // Kleinbuchstaben für bessere Übereinstimmung
            case 'javascript': return 'fab fa-js';
            case 'html': return 'fab fa-html5';
            case 'css': return 'fab fa-css3-alt';
            case 'python': return 'fab fa-python';
            case 'java': return 'fab fa-java';
            case 'c#': return 'fab fa-node-js'; // C# hat kein direktes FA-Icon, Node.js als Platzhalter oder neutrales Icon
            case 'typescript': return 'fab fa-node-js'; // TypeScript hat auch kein direktes FA-Icon
            case 'c++': return 'fas fa-file-code'; // Generisches Code-Datei-Icon
            case 'c': return 'fas fa-file-code'; // Generisches Code-Datei-Icon
            case 'php': return 'fab fa-php';
            case 'ruby': return 'fas fa-gem'; // Generisches Edelstein-Icon oft für Ruby verwendet
            case 'go': return 'fab fa-gofore'; // Go hat ein Icon
            case 'shell': return 'fas fa-terminal'; // Terminal-Icon
            case 'vue': return 'fab fa-vuejs';
            case 'react': return 'fab fa-react';
            case 'angular': return 'fab fa-angular';
            case 'swift': return 'fab fa-swift';
            case 'dart': return 'fas fa-circle-notch'; // Generisches Rad-Icon oder Dot
            case 'kotlin': return 'fas fa-code'; // Generisches Code-Icon
            case 'rust': return 'fas fa-wrench'; // Generisches Werkzeug-Icon
            default: return null; // Kein spezifisches Icon gefunden
        }
    }

    // Die Funktion getLanguageColor bleibt wie sie ist (oder du kannst sie entfernen, wenn du Farben nur noch über CSS steuern willst)
    function getLanguageColor(language) {
        switch (language) {
            case 'JavaScript': return '#f1e05a';
            case 'HTML': return '#e34c26';
            case 'CSS': return '#563d7c';
            case 'Python': return '#3572A5';
            case 'Java': return '#b07219';
            case 'C#': return '#178600';
            case 'TypeScript': return '#2b7489';
            case 'C++': return '#f34b7d';
            case 'C': return '#555555';
            case 'PHP': return '#4F5D95';
            case 'Ruby': return '#701516';
            case 'Go': return '#00ADD8';
            case 'Shell': return '#89e051';
            case 'Vue': return '#41b883';
            case 'Svelte': return '#ff3e00';
            case 'Dart': return '#00B4AB';
            case 'Kotlin': return '#A97BFF';
            case 'Rust': return '#dea584';
            case 'Swift': return '#ffac45';
            default: return '#cccccc'; // Standardfarbe für unbekannte Sprachen
        }
    }    

    function showRepoDetails(repoName) {
        if (!repoName) return;
        
        titleContainer.classList.add('title-moved-up');
        readmeContainer.style.display = 'block';
        aboutMeContainer.style.display = 'none';
        futureProjectsContainer.style.display = 'none';

        // NEU: Basis-URL für Rohdateien im aktuellen Repository
        const githubRawBaseUrl = `https://raw.githubusercontent.com/${username}/${repoName}/main`;

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
                // NEU: Text vor dem Parsen vorbereiten, um den Platzhalter zu ersetzen
                // Dies ist ein Workaround, da der Marked Renderer nicht direkt dynamische Daten erhält.
                // Eine bessere Methode wäre, den Renderer bei jedem Aufruf neu zu konfigurieren,
                // aber das hier ist für den Anfang einfacher.
                const processedText = text.replace(/src="(?!https?:\/\/)(?!data:)(?!__GITHUB_RAW_BASE_URL__)([^"]+)"/g, (match, p1) => {
                    // Ersetze nur relative src-Attribute, die nicht schon absolute URLs sind
                    // und nicht unseren eigenen Platzhalter enthalten.
                    return `src="${githubRawBaseUrl}/${p1}"`;
                });
                // Falls es Markdown-Bilder gibt: ![alt text](images/pic.png)
                const markdownProcessedText = processedText.replace(/!\[(.*?)\]\((?!https?:\/\/)(?!data:)([^)]+)\)/g, (match, p1, p2) => {
                    // Ersetze relative Markdown-Bildpfade
                    return `![${p1}](${githubRawBaseUrl}/${p2})`;
                });


                readmeContainer.innerHTML = `<h2>${repoName}</h2><hr>` + 
                    (window.marked ? marked.parse(markdownProcessedText) : markdownProcessedText);
                    // Den geparsten Text an marked.parse übergeben
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
