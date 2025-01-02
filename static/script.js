let lastScrollY = window.scrollY;
const header = document.querySelector('header');

if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > lastScrollY) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScrollY = window.scrollY;
    });

    document.addEventListener("DOMContentLoaded", () => {
        let isDesktop = window.innerWidth > 640;

        const state = {
            isChatOpen: false,
            isFetching: false,
            lastSuggestedQuestion: "",
        };

        const chatbotLink = document.getElementById("chatbot-link");
        const chatOverlay = document.getElementById("desktop-chat-overlay");
        const chatContainer = document.getElementById("desktop-chat-container");
        const closeButton = document.querySelector(".close-button");
        const suggestionBox = document.getElementById("cursor-suggestion");

        const chatBox = document.querySelector(isDesktop ? "#desktop-chat-overlay .chat-box" : "#mobile-chat-interface .chat-box");
        const userInput = document.querySelector(isDesktop ? "#desktop-chat-overlay .user-input" : "#mobile-chat-interface .user-input");
        const sendButton = document.querySelector(isDesktop ? "#desktop-chat-overlay .send-button" : "#mobile-chat-interface .send-button");
        const inputBox = document.querySelector(isDesktop ? "#desktop-chat-overlay .input-box" : "#mobile-chat-interface .input-box");

        let cursorTimeout = null;
        let lastMouseX = -1, lastMouseY = -1;

        async function handleSuggestion(mouseX, mouseY, viewportWidth, viewportHeight) {
            // const elements = document.elementsFromPoint(mouseX - window.pageXOffset, mouseY - window.pageYOffset);

            const detectionRadius = 80; // 감지할 추가 반경 (px)
            const expandedElements = [];

            // 감지 영역 확장을 위해 여러 점에서 감지 수행
            for (let offsetX = -detectionRadius; offsetX <= detectionRadius; offsetX += 10) {
                for (let offsetY = -detectionRadius; offsetY <= detectionRadius; offsetY += 10) {
                    const detectedElements = document.elementsFromPoint(
                        mouseX + offsetX - window.pageXOffset,
                        mouseY + offsetY - window.pageYOffset
                    );
                    expandedElements.push(...detectedElements);
                }
            }

            // 중복 요소 제거
            const elements = [...new Set(expandedElements)];

            let suggestionText = "Do you have a question? Click to ask!";
            let timelineItem = null;

            // 타임라인 아이템 탐지
            for (const element of elements) {
                if (element.classList.contains("timeline-item")) {
                    timelineItem = element;
                    break;
                }
            }

            if (timelineItem) {
                const id = timelineItem.getAttribute("data-id") || "";
                const title = timelineItem.querySelector("h3")?.innerText || "";

                if (state.isFetching) return;
                state.isFetching = true;

                suggestionBox.textContent = "...";
                suggestionBox.classList.add("loading-indicator");
                suggestionBox.style.visibility = "visible";

                requestAnimationFrame(() => {
                    updateSuggestionBoxPosition(mouseX, mouseY, viewportWidth, viewportHeight);
                });

                try {
                    const response = await fetch('https://chatbot-833717518964.asia-northeast3.run.app/question', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ item: id }),
                        credentials: "include",
                    });

                    const data = await response.json();
                    state.lastSuggestedQuestion = data?.question || "";
                    suggestionText = 'Ask me about my work on ' + title + ', like "' + data?.question + '"' || suggestionText;
                } catch (error) {
                    console.error("Error:", error);
                } finally {
                    state.isFetching = false;

                    suggestionBox.textContent = suggestionText;
                    suggestionBox.classList.remove("loading-indicator");

                    updateSuggestionBoxPosition(mouseX, mouseY, viewportWidth, viewportHeight);
                }
            } else {
                suggestionBox.textContent = suggestionText;
                suggestionBox.style.visibility = "visible";
                updateSuggestionBoxPosition(mouseX, mouseY, viewportWidth, viewportHeight);
            }
        }

        function updateSuggestionBoxPosition(mouseX, mouseY, viewportWidth, viewportHeight) {
            const suggestionBoxWidth = suggestionBox.offsetWidth;
            const suggestionBoxHeight = suggestionBox.offsetHeight;

            let suggestionLeft = mouseX + 20;
            let suggestionTop = mouseY + 10;

            if (mouseX + suggestionBoxWidth + 30 > viewportWidth) {
                suggestionLeft = mouseX - suggestionBoxWidth;
            }

            if (mouseY + suggestionBoxHeight + 10 > viewportHeight) {
                suggestionTop = mouseY - suggestionBoxHeight;
            }

            suggestionLeft = Math.max(suggestionLeft, 10);
            suggestionTop = Math.max(suggestionTop, 10);

            suggestionBox.style.left = `${suggestionLeft}px`;
            suggestionBox.style.top = `${suggestionTop}px`;
        }

        if (isDesktop) {
            document.addEventListener("mousemove", (e) => {
                const mouseX = e.pageX;
                const mouseY = e.pageY;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                if (state.isChatOpen || state.isFetching) {
                    clearTimeout(cursorTimeout);
                    suggestionBox.style.visibility = "hidden";
                    document.body.classList.remove("custom-cursor");
                    return;
                }

                if (mouseX !== lastMouseX || mouseY !== lastMouseY) {
                    clearTimeout(cursorTimeout);
                    suggestionBox.style.visibility = "hidden";
                    document.body.classList.remove("custom-cursor");

                    cursorTimeout = setTimeout(() => {
                        if (state.isChatOpen) return;
                        document.body.classList.add("custom-cursor");
                        handleSuggestion(mouseX, mouseY, viewportWidth, viewportHeight);
                    }, 3000);
                }

                lastMouseX = mouseX;
                lastMouseY = mouseY;
            });

            document.addEventListener("click", (e) => {
                if (document.body.classList.contains("custom-cursor")) {
                    chatOverlay.style.display = "flex";
                    state.isChatOpen = true;
                    document.body.classList.remove("custom-cursor");
                    suggestionBox.style.visibility = "hidden";

                    if (state.lastSuggestedQuestion && state.lastSuggestedQuestion !== "Do you have a question? Click to ask!") {
                        userInput.value = state.lastSuggestedQuestion;
                        sendMessage(chatBox, inputBox);
                    }
                }
            });
        }

        function setChatbotLinkBehavior() {
            chatbotLink.onclick = (e) => {
                e.preventDefault();

                if (isDesktop) {
                    chatOverlay.style.display = "flex";
                    state.isChatOpen = true;
                } else {
                    document.getElementById("mobile-chat-interface").scrollIntoView({ behavior: "smooth" });
                }
            }

            closeButton.addEventListener("click", () => {
                chatOverlay.style.display = "none";
                state.isChatOpen = false;
                document.body.classList.remove("custom-cursor");
                clearTimeout(cursorTimeout);
            });

            chatOverlay.addEventListener("click", (e) => {
                if (state.isChatOpen && !chatContainer.contains(e.target)) {
                    chatOverlay.style.display = "none";
                    state.isChatOpen = false;
                    document.body.classList.remove("custom-cursor");
                    clearTimeout(cursorTimeout);
                }
            });

        }

        setChatbotLinkBehavior();

        window.addEventListener("resize", () => {
            const newIsDesktop = window.innerWidth > 640;
            if (newIsDesktop !== isDesktop) {
                isDesktop = newIsDesktop;
                setChatbotLinkBehavior();
            }
        });

        async function sendMessage(chatBox, inputBox) {
            const userMessage = userInput.value.trim();
            if (!userMessage) return;

            const userMessageElem = document.createElement("div");
            userMessageElem.classList.add("message", "user-message");
            userMessageElem.textContent = userMessage;
            chatBox.insertBefore(userMessageElem, inputBox);

            userInput.value = "";

            const loadingMessageContainer = document.createElement("div");
            loadingMessageContainer.classList.add("bot-message-container", "loading-indicator");

            const botImage = document.createElement("img");
            botImage.src = "/image.png";
            botImage.alt = `It's me!`;

            const loadingMessageElem = document.createElement("div");
            loadingMessageElem.classList.add("message", "bot-message");
            loadingMessageElem.textContent = "...";

            loadingMessageContainer.appendChild(botImage);
            loadingMessageContainer.appendChild(loadingMessageElem);
            chatBox.insertBefore(loadingMessageContainer, inputBox);

            chatBox.scrollTop = chatBox.scrollHeight;

            try {
                const response = await fetch('https://chatbot-833717518964.asia-northeast3.run.app/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage }),
                    credentials: "include",
                });

                const data = await response.json();

                loadingMessageElem.textContent = data.reply;
                loadingMessageContainer.classList.remove("loading-indicator");
            } catch (error) {
                loadingMessageElem.textContent = 'Oops! Something went wrong. Please try again.';
                loadingMessageContainer.classList.remove("loading-indicator");
                console.error(error);
            } finally {
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }

        sendButton.addEventListener("click", () => sendMessage(chatBox, inputBox));
        userInput.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                sendMessage(chatBox, inputBox);
            }
        });
    });
}

async function loadMarkdownFile(projectId) {
    const markdownPath = `/database/notion/${projectId}.md`;

    try {
        const response = await fetch(markdownPath);
        if (!response.ok) throw new Error('Markdown file not found');
        const markdown = await response.text();

        const title = markdown.split('\n')[0].replace(/^#\s/, '');
        const infoRegex = /Role: (.+?)\s+Skills: (.+?)\s+Duration: (.+?)$/m;
        const infoMatch = markdown.match(infoRegex);
        const infoContent = infoMatch
            ? `<p><strong>Role:</strong> ${infoMatch[1]}<br><strong>Skills:</strong> ${infoMatch[2]}<br><strong>Duration:</strong> ${infoMatch[3]}</p>`
            : 'Info not available';

        const contentStartIndex = markdown.indexOf("---");
        const content = contentStartIndex > -1 ? markdown.slice(contentStartIndex + 3) : markdown;

        marked.setOptions({
            gfm: true,
            breaks: true,
            headerIds: false
        });
        const parsedContent = marked.parse(content);

        document.title = title;

        // 콘텐츠 업데이트
        document.getElementById('project-title').innerText = title; // 제목
        document.getElementById('project-info').innerHTML = infoContent; // Info
        document.getElementById('project-content').innerHTML = parsedContent;
    } catch (error) {
        console.error('Error loading markdown:', error);
        document.getElementById('project-content').innerHTML = '<p>Error loading project details.</p>';
    }
}

// URL에서 프로젝트 ID 추출
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id'); // 예: ?id=project_0
if (projectId) {
    loadMarkdownFile(projectId);
} 
