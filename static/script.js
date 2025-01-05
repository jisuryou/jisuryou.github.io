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

    const timelineData = {
        education: [
            {
                side: 'left',
                year: 2017,
                title: 'Sungkyunkwan University, Korea',
                subtitle: 'Mar 2017-Aug 2021',
                id: '170b4c07aa58801dac70cd2406559ca5',
                details: `
                        <i>Bachelor of Engineering and Bachelor of Science in Psychology</i>
                        <br>(1st) Dept. of Software, College of Software Convergence
                        <br>(2nd) Dept. of Psychology, College of Social Sciences
                    `
            },
            {
                side: 'left',
                year: 2019,
                title: 'The University of Texas at Dallas, United States',
                subtitle: 'Jan 2019-May 2019',
                id: '170b4c07aa588008903ed825d52ba812',
                details: `
                        <i>Exchange Student</i>
                    `
            },
            {
                side: 'left',
                year: 2021,
                title: 'Seoul National University, Korea',
                subtitle: 'Sep 2021-Feb 2024',
                id: '170b4c07aa58804e80faf5058ac08491',
                details: `
                        <i>Master of Engineering</i>
                        <br>Dept. of Intelligence and Information, The Graduate School of Convergence Science and Technology (GSCST)
                        <br>Advisor: Prof. Joongseek Lee (UXLab)
                        <br>* (Best Paper) Study on a VA Journaling System: Focusing on Response Styles for Receiving Long Entries in VA Journaling
                    `
            },
            {
                side: 'right',
                year: 2020,
                title: 'Rihoz, Seoul, Korea',
                subtitle: 'Sep 2020-Dec 2020',
                id: '170b4c07aa5880049acac1fd0d5348af',
                details: `
                        <i>Front-End Developer (Intern)</i>
                        <br>• Contributed to the project ‘Dangjib (Your Smart Butler)’, a big data driven smart life service platform
                        <br>• Focused on front-end development of the admin web page and the production app
                    `
            },
            {
                side: 'right',
                year: 2024,
                title: 'SNU UXLab, Seoul, Korea',
                subtitle: 'March 2024-Aug 2024',
                id: '170b4c07aa5880768155e8c655941f3d',
                details: `
                        <i>Project Manager (PM)</i>
                        <br>• Led the project ‘Financial Hyper-Personalization Using MyData’ with HiUX
                        <br>• Led the project ‘UX Evaluation of Text-Based Conversational Experiences’ with LG
                    `
            }
        ],
        projects: [
            {
                side: 'left',
                year: 2021.07,
                title: 'Trend Recommendation Chatbot (Lab pj)',
                subtitle: '2 months (Jul 2021-Aug 2021)',
                id: '196b81a14320412ab2592b7c0a381c27',
                details: `
                        #Conversational AI #Researcher  
                        <br>Participated in all project phases and led the development stage.
                    `
            },
            {
                side: 'left',
                year: 2021.09,
                title: 'Advancing Financial Chatbots via Voice Banking (with Taran UXD)',
                subtitle: '2 months (Sep 2021-Oct 2021)',
                id: 'd3d530dd1b144bb08d58515122bc0726',
                details: `
                        #Conversational AI #Researcher
                        <br>Contributed to research and user interviews.
                    `
            },
            {
                side: 'left',
                year: 2022.01,
                title: 'Dream Journal Voice Agent (Lab pj)',
                subtitle: '4 months (Jan 2022-Apr 2022)',
                id: '7b9a2d1b3e4d4730a954a63ec4d30378',
                details: `
                        #Conversational AI #Project Manager
                        <br>Led all phases of the project.
                    `
            },
            {
                side: 'left',
                year: 2022.09,
                title: 'Exhibition Mind Robots Integrated with AI (with KOCCA)',
                subtitle: '4 months (Sep 2022-Dec 2022)',
                id: 'cd10d260a5154d94825325fe6013ad60',
                details: `
                        #Conversational AI #Developer
                        <br>Led the development stage.
                    `
            },
            {
                side: 'left',
                year: 2024.05,
                title: 'UX Evaluation of Text-Based Conversational Experiences (with LG)',
                subtitle: '4 months (May 2024-Aug 2024)',
                id: '118b4c07aa588086bd60f682d6403c7b',
                details: `
                        #Conversational AI #Project Manager
                        <br>Led all phases of the project.
                    `
            },
            {
                side: 'right',
                year: 2022.03,
                title: 'UX Improvement for Shopping Platforms (with Naver Shopping)',
                subtitle: '4 months (Mar 2022-Jun 2022)',
                id: '0f5581ddde1646cba87031a0305453b9',
                details: `
                        #User Experience #Researcher
                        <br>Conducted log data analysis and participated in user interviews.
                    `
            },
            {
                side: 'right',
                year: 2022.07,
                title: 'Opportunity Discovery for Home Appliance Subscription Services (with Samsung)',
                subtitle: '4 months (Jul 2022-Oct 2022)',
                id: '51972da67f87477a9138830cbc5f59fc',
                details: `
                        #User Experience #Project Manager
                        <br>Led all phases of the project.
                    `
            },
            {
                side: 'right',
                year: 2023.01,
                title: 'Clothing Care Pilot for Shared Housing (with Samsung)',
                subtitle: '3 months (Jan 2023-Mar 2023)',
                id: '9221221ec6d940319b231302b77a5746',
                details: `
                        #User Experience #Developer
                        <br>Contributed to backend development.
                    `
            },
            {
                side: 'right',
                year: 2024.03,
                title: 'Financial Hyper-Personalization Using MyData (with HiUX)',
                subtitle: '6 months (Mar 2024-Aug 2024)',
                id: '118b4c07aa588059ad4debdb5a5b70a3',
                details: `
                        #User Experience #Project Manager
                        <br>Led all phases of the project.
                    `
            },
            {
                side: 'right',
                year: 2024.11,
                title: 'SNU Cultural Accessibility Site for People with Disabilities (with Institute for Culture and Arts)',
                subtitle: '2 months (Nov 2024-Dec 2024)',
                id: '170b4c07aa588075952eeba8235f7f32',
                details: `
                        #User Experience #Developer
                        <br>Led the development stage.
                    `
            }
        ]
    };

    document.addEventListener("DOMContentLoaded", () => {
        let isDesktop = window.innerWidth > 640;

        const state = {
            isChatOpen: false,
            isFetching: false,
            lastSuggestedQuestion: ""
        };

        const timelineContainer = document.querySelector(".timeline-container");
        const chatbotLink = document.getElementById("chatbot-link");
        const chatOverlay = document.getElementById("desktop-chat-overlay");
        const chatContainer = document.getElementById("desktop-chat-container");
        const closeButton = document.querySelector(".close-button");
        const timelineTabs = document.querySelectorAll(".tab-button");

        const chatBox = document.querySelector(isDesktop ? "#desktop-chat-overlay .chat-box" : "#mobile-chat-interface .chat-box");
        const userInput = document.querySelector(isDesktop ? "#desktop-chat-overlay .user-input" : "#mobile-chat-interface .user-input");
        const sendButton = document.querySelector(isDesktop ? "#desktop-chat-overlay .send-button" : "#mobile-chat-interface .send-button");
        const inputBox = document.querySelector(isDesktop ? "#desktop-chat-overlay .input-box" : "#mobile-chat-interface .input-box");

        let activeTab = "education";

        const defaultQuestion = "Do you have a question? Click to ask!";

        // 타임라인 아이템 렌더링 함수
        function renderTimelineItems(tab) {
            timelineContainer.innerHTML = '<div class="timeline-line"></div>';
            const items = timelineData[tab];
            const timelineItems = items.map(item => ({
                item: createTimelineItem(item, tab),
                dot: createTimelineDot(item),
            }));

            applyPosition(timelineItems);
        }

        function createTimelineItem(item, tab) {
            const timelineItem = document.createElement("div");
            timelineItem.classList.add("timeline-item");
            timelineItem.dataset.startYear = item.year;
            timelineItem.dataset.side = item.side;
            timelineItem.dataset.category = tab;
            timelineItem.dataset.id = item.id;
            timelineItem.dataset.title = item.title;

            timelineItem.innerHTML = `
            <h3>
                ${tab == 'projects' ? `<a href="/project.html?id=${item.id}" target="_blank">${item.title}</a>` : item.title}
            </h3>
            <h5>${item.subtitle}</h5>
            <p>${item.details}</p>
        `;

            return timelineItem;
        }

        function createTimelineDot(item) {
            const timelineDot = document.createElement("div");
            timelineDot.classList.add("timeline-dot");
            timelineDot.dataset.id = item.id;
            timelineDot.dataset.title = item.title;

            timelineDot.addEventListener("mouseenter", () => showTooltip(timelineDot, item));
            timelineDot.addEventListener("mouseleave", hideTooltip);
            timelineDot.addEventListener("click", () => openChatWithItem(item));

            return timelineDot;
        }

        // 위치 계산 및 적용 함수
        function applyPosition(items) {
            const sortedItems = items.sort((a, b) => parseFloat(a.item.dataset.startYear) - parseFloat(b.item.dataset.startYear));
            let cumulativePosition = 50; // 첫 아이템 위치

            sortedItems.forEach(({ item, dot }, index) => {
                timelineContainer.appendChild(item);
                const itemHeight = item.offsetHeight; // 실제 아이템의 높이

                item.style.position = "absolute";
                item.style.top = `${cumulativePosition}px`;

                if (isDesktop) {
                    const sideClass = item.dataset.side === "left" ? "timeline-left" : "timeline-right";
                    item.classList.add(sideClass);
                    dot.style.position = "absolute";
                    dot.style.top = `${cumulativePosition + 15}px`;
                    dot.style.left = "calc(50% - 5px)";
                    timelineContainer.appendChild(dot);
                } else {
                    item.classList.remove("timeline-left", "timeline-right");
                }

                setTimeout(() => item.classList.add("visible"), index * 100);
                cumulativePosition += itemHeight + (isDesktop ? 40 : 30);
            });

            timelineContainer.style.height = `${cumulativePosition}px`;
        }

        function showTooltip(dot, item) {
            const tooltip = document.createElement('div');
            tooltip.classList.add('tooltip');
            tooltip.innerText = "...";

            // 반대쪽 위치에 말풍선 표시
            const side = item.side === 'left' ? 'left' : 'right';
            tooltip.style.position = 'absolute';
            tooltip.style.top = dot.style.top;
            tooltip.style[side] = 'calc(50% + 20px)';

            timelineContainer.appendChild(tooltip);
            dot.tooltip = tooltip;

            handleSuggestion(item)
                .then(suggestionText => {
                    tooltip.innerText = suggestionText || defaultQuestion;
                }).catch(error => {
                    console.error("Error fetching suggestion:", error);
                    tooltip.innerText = defaultQuestion;
                });
        }

        function hideTooltip(event) {
            const dot = event.target;
            if (dot.tooltip) {
                timelineContainer.removeChild(dot.tooltip);
                dot.tooltip = null;
            }
        }

        function openChatWithItem(item) {
            chatOverlay.style.display = "flex";
            state.isChatOpen = true;

            if (state.lastSuggestedQuestion && state.lastSuggestedQuestion !== defaultQuestion) {
                userInput.value = state.lastSuggestedQuestion;
                sendMessage(chatBox, inputBox);
            }
        }

        async function handleSuggestion(item) {
            let suggestionText = defaultQuestion;

            if (state.isFetching) return suggestionText;
            state.isFetching = true;

            try {
                const response = await fetch('https://chatbot-833717518964.asia-northeast3.run.app/question', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ doc: item.id }),
                });

                const data = await response.json();
                state.lastSuggestedQuestion = data.question || defaultQuestion;
                suggestionText = `Ask me, like ${data.question}` || suggestionText;
            } catch (error) {
                console.error("Error fetching suggestion:", error);
                state.lastSuggestedQuestion = defaultQuestion;
            } finally {
                state.isFetching = false;
                return suggestionText;
            }
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
            });

            chatOverlay.addEventListener("click", (e) => {
                if (state.isChatOpen && !chatContainer.contains(e.target)) {
                    chatOverlay.style.display = "none";
                    state.isChatOpen = false;
                }
            });

        }

        setChatbotLinkBehavior();
        renderTimelineItems(activeTab);

        timelineTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                timelineTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                activeTab = tab.dataset.tab;
                startYear = activeTab === "education" ? 2017 : 2021;
                endYear = activeTab === "education" ? 2024 : 2024;

                timelineContainer.style.height = "0px";
                setTimeout(() => renderTimelineItems(activeTab), 500);
            });
        });

        window.addEventListener("resize", () => {
            const newIsDesktop = window.innerWidth > 640;
            if (newIsDesktop !== isDesktop) {
                isDesktop = newIsDesktop;
                timelineContainer.innerHTML = '<div class="timeline-line"></div>';
                setChatbotLinkBehavior();
            }
            renderTimelineItems(activeTab);
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
