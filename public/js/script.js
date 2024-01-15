
const emotions = ['null', 'happiness', 'sadness', 'disgust', 'surprise', 'fear', 'anger'];

function next() {
    // 創建一個包含 UUID 的物件
    const payload = {
        uuid: window.user.sub,
    };

    // 使用 fetch 發送 POST 請求
    fetch('/API/nextPage', {
        method: 'POST', // 指定請求方法為 POST
        headers: {
            'Content-Type': 'application/json' // 指定請求內容類型為 JSON
        },
        body: JSON.stringify(payload) // 將物件轉換為 JSON 字串作為請求主體
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // 將響應轉換為 JSON
        })
        .then(data => {
            // 處理 JSON 響應
            displayPage(data.docs, data.current_page, data.total_page, data.answer);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            // 處理錯誤情況，例如顯示錯誤信息
        });
}

function prev() {
    // 創建一個包含 UUID 的物件
    const payload = {
        uuid: window.user.sub
    };

    // 使用 fetch 發送 POST 請求
    fetch('/API/prevPage', {
        method: 'POST', // 指定請求方法為 POST
        headers: {
            'Content-Type': 'application/json' // 指定請求內容類型為 JSON
        },
        body: JSON.stringify(payload) // 將物件轉換為 JSON 字串作為請求主體
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json(); // 將響應轉換為 JSON
        })
        .then(data => {
            // 處理 JSON 響應
            displayPage(data.docs, data.current_page, data.total_page, data.answer);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            // 處理錯誤情況，例如顯示錯誤信息
        });
}




// 這個函數根據提供的數據和頁碼顯示頁面
function displayPage(data, current_page, total_page, answer) {
    let contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';

    // 從數據中獲取文檔資訊
    let doc = data;
    let docDiv = document.createElement('div');
    docDiv.className = 'doc';
    let header = document.createElement('div');
    header.className = 'doc-header';
    header.innerText = 'Document ID: ' + doc.doc_id;
    docDiv.appendChild(header);

    // 為每個子句創建一個容器
    doc.clauses.forEach((clause, index) => {
        let clauseDiv = document.createElement('div');
        clauseDiv.className = 'clause';
        let clauseText = document.createElement('div');
        clauseText.className = 'clause-text';
        clauseText.innerText = (index + 1) + ". " + clause.clause;
        clauseDiv.appendChild(clauseText);

        // 創建情緒選擇器並設置預設值

        let emotion = "null"
        let emotionSelect = createEmotionSelect(emotion);
        clauseDiv.appendChild(emotionSelect);

        // 創建一個容器來放置原因和分數選擇器
        let causesContainer = document.createElement('div');
        causesContainer.className = 'causes-container';
        clauseDiv.appendChild(causesContainer);

        // 添加和刪除按鈕
        let addButton = document.createElement('button');
        addButton.className = 'add-cause';
        addButton.innerText = '+';
        addButton.addEventListener('click', () => addCauseAndScore(causesContainer, index));
        clauseDiv.appendChild(addButton);

        let deleteButton = document.createElement('button');
        deleteButton.className = 'delete-cause';
        deleteButton.innerText = '-';
        deleteButton.addEventListener('click', () => deleteCauseAndScore(causesContainer, index));
        clauseDiv.appendChild(deleteButton);

        docDiv.appendChild(clauseDiv);
    });

    contentDiv.appendChild(docDiv);

    processSelections(answer);
    document.getElementById('current-page').textContent = '目前頁數 ' + current_page;
    document.getElementById('total-pages').textContent = '總頁數 ' + total_page;
}



function processSelections(answer) {
    if (answer && Array.isArray(answer.selections)) {
        answer.selections.forEach((selection) => {
            // 查找所有子句元素
            const allClauseDivs = document.querySelectorAll('.clause');
            let clauseDiv = null;


            allClauseDivs.forEach(div => {
                const clauseTextDiv = div.querySelector('.clause-text');
                if (clauseTextDiv && clauseTextDiv.innerText.startsWith(selection.clause_id + ". ")) {
                    clauseDiv = div;
                }
            });

            if (clauseDiv) {
                // 找到情緒選擇器並設置值
                let emotionSelect = clauseDiv.querySelector('.emotion-select');
                if (emotionSelect) {
                    emotionSelect.value = selection.emotion;
                }

                // 找到原因容器
                let causesContainer = clauseDiv.querySelector('.causes-container');
                if (causesContainer) {
                    // 為每個原因添加原因和分數
                    selection.causes.forEach(cause => {
                        addCauseAndScore(causesContainer, 0, cause.id, cause.score);
                    });
                }
            }
        });
    }
}



// 創建情緒選擇器的函數，接受一個預設情緒值作為參數
function createEmotionSelect(defaultEmotion) {
    let select = document.createElement('select');
    select.className = 'emotion-select';

    // 添加預設選項
    let defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.text = "請選擇情緒";
    select.appendChild(defaultOption);


    // 為每種情緒添加選項
    emotions.forEach(emotion => {
        let option = document.createElement('option');
        option.value = emotion;
        option.text = emotion;
        select.appendChild(option);
    });

    // 如果提供了預設情緒，則將其設為選中
    if (defaultEmotion && defaultEmotion != "null") {
        select.value = defaultEmotion;
    }

    return select;
}

// 修改後的 addCauseAndScore 函數，以接受預選的原因 ID 和分數
function addCauseAndScore(container, index, selectedCauseId, selectedScore) {
    const causenumber = container.querySelectorAll('.cause-select').length;
    if (causenumber >= 3) {
        return;
    }

    const allClausesTexts = Array.from(document.querySelectorAll('.clause-text')).map(clauseElem => {
        return clauseElem.innerText;
    });

    let causeSelect = createCauseSelect(allClausesTexts, selectedCauseId);
    container.appendChild(causeSelect);

    let scoreSelect = createScoreSelect(selectedScore);
    container.appendChild(scoreSelect);
}


// 刪除原因和分數選擇器的函數
function deleteCauseAndScore(container, index) {
    if (container.lastChild) {
        container.removeChild(container.lastChild);
    }
    if (container.lastChild) {
        container.removeChild(container.lastChild);
    }
}



// 創建原因選擇器的函數，接受所有子句文本和一個預選的原因 ID
function createCauseSelect(allClausesTexts, selectedCauseId) {
    let select = document.createElement('select');
    select.className = 'cause-select';

    // 添加預設選項
    let nullOption = document.createElement('option');
    nullOption.value = '';
    nullOption.text = '選擇原因子句';
    select.appendChild(nullOption);

    // 為每個子句添加選項
    allClausesTexts.forEach((clauseText, index) => {
        let option = document.createElement('option');
        option.value = (index + 1).toString();
        option.text = clauseText;
        select.appendChild(option);
    });

    // 如果提供了預選的原因 ID，則將其設為選中
    if (selectedCauseId !== undefined && selectedCauseId !== null) {
        selectedCauseId = selectedCauseId.toString();
        select.value = selectedCauseId;
    }

    return select;
}

function createScoreSelect(selectedScore) {
    let select = document.createElement('select');
    select.className = 'score-select';

    // 添加空選項
    let emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.text = '選擇相關程度';
    select.appendChild(emptyOption);

    // 添加分數選項
    for (let i = 1; i <= 2; i++) {
        let option = document.createElement('option');
        option.value = i.toString();
        option.text = i === 1 ? '較弱對應' : '較強對應';
        if (selectedScore && parseInt(selectedScore) === i) {
            option.selected = true;
        }
        select.appendChild(option);
    }

    return select;
}

function onSignIn(googleUser) {
    // 獲取用戶的基本資訊
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId());
    console.log('Full Name: ' + profile.getName());
    console.log('Given Name: ' + profile.getGivenName());
    console.log('Family Name: ' + profile.getFamilyName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail());

    // 可以將 token 發送到服務器
    var id_token = googleUser.getAuthResponse().id_token;
    console.log("ID Token: " + id_token);
}


function checkEmotionSelectsBeforeSubmit() {
    const emotionSelects = document.querySelectorAll('.emotion-select');
    for (let select of emotionSelects) {
        if (select.value === "" || select.value === "請選擇情緒") {
            alert("請為所有子句選擇一個情緒。");
            return false; // 阻止表單提交
        }
    }
    return true; // 允許表單提交
}



document.getElementById('prev').addEventListener('click', function (event) {
    if (!checkEmotionSelectsBeforeSubmit()) {
        event.preventDefault(); // 阻止表單提交
        return;
    }
    const username = window.user.sub;
    const docId = document.querySelector('.doc-header').innerText.split(': ')[1] || 'unknown';
    const allClauses = document.querySelectorAll('.clause');
    const data = {
        doc_id: docId,
        uuid: username,
        selections: []
    };

    allClauses.forEach((clauseElement, index) => {
        const clauseData = {
            clause_id: index + 1,
            emotion: getValue(clauseElement, '.emotion-select'),
            causes: []
        };

        const causeSelects = clauseElement.querySelectorAll('.cause-select');
        const scoreSelects = clauseElement.querySelectorAll('.score-select');

        for (let i = 0; i < causeSelects.length; i++) {
            if (causeSelects[i].value) {
                let cause = { "id": causeSelects[i].value, "score": scoreSelects[i].value.toString() };
                clauseData.causes.push(cause);
            }
        }

        data.selections.push(clauseData);
    });

    fetch('/API/prevPage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }) // 將響應轉換為 JSON
        .then(data => {
            alert('表單已成功提交');
            displayPage(data.docs, data.current_page, data.total_page, data.answer);
        })
        .catch((error) => {
            alert('表單上傳失敗');
            console.error('Error:', error);
        });
}
);

document.getElementById('next').addEventListener('click', function (event) {
    if (!checkEmotionSelectsBeforeSubmit()) {
        event.preventDefault(); // 阻止表單提交
        return;
    }
    const username = window.user.sub;
    const docId = document.querySelector('.doc-header').innerText.split(': ')[1] || 'unknown';
    const allClauses = document.querySelectorAll('.clause');
    const data = {
        doc_id: docId,
        uuid: username,
        selections: []
    };

    allClauses.forEach((clauseElement, index) => {
        const clauseData = {
            clause_id: index + 1,
            emotion: getValue(clauseElement, '.emotion-select'),
            causes: []
        };

        const causeSelects = clauseElement.querySelectorAll('.cause-select');
        const scoreSelects = clauseElement.querySelectorAll('.score-select');

        for (let i = 0; i < causeSelects.length; i++) {
            if (causeSelects[i].value) {
                let cause = { "id": causeSelects[i].value, "score": scoreSelects[i].value.toString() };
                clauseData.causes.push(cause);
            }
        }

        data.selections.push(clauseData);
    });

    fetch('/API/nextPage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }) // 將響應轉換為 JSON
        .then(data => {
            alert('表單已成功提交');
            displayPage(data.docs, data.current_page, data.total_page, data.answer);
        })
        .catch((error) => {
            alert('表單上傳失敗');
            console.error('Error:', error);
        });
}
);

document.getElementById('continue').addEventListener('click', function (event) {
    if (!checkEmotionSelectsBeforeSubmit()) {
        event.preventDefault(); // 阻止表單提交
        return;
    }
    const username = window.user.sub;
    const docId = document.querySelector('.doc-header').innerText.split(': ')[1] || 'unknown';
    const allClauses = document.querySelectorAll('.clause');
    const data = {
        doc_id: docId,
        uuid: username,
        selections: [],
        tail: true
    };

    allClauses.forEach((clauseElement, index) => {
        const clauseData = {
            clause_id: index + 1,
            emotion: getValue(clauseElement, '.emotion-select'),
            causes: []
        };

        const causeSelects = clauseElement.querySelectorAll('.cause-select');
        const scoreSelects = clauseElement.querySelectorAll('.score-select');

        for (let i = 0; i < causeSelects.length; i++) {
            if (causeSelects[i].value) {
                let cause = { "id": causeSelects[i].value, "score": scoreSelects[i].value.toString() };
                clauseData.causes.push(cause);
            }
        }

        data.selections.push(clauseData);
    });

    fetch('/API/nextPage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        }) // 將響應轉換為 JSON
        .then(data => {
            alert('表單已成功提交');
            displayPage(data.docs, data.current_page, data.total_page, data.answer);
        })
        .catch((error) => {
            alert('表單上傳失敗');
            console.error('Error:', error);
        });
}
);


function getValue(parentElement, selector) {
    const element = parentElement.querySelector(selector);
    return element && element.value ? element.value : null;
}



document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('select').forEach(select => {
        console.log(savedValue);
        if (savedValue) {
            select.value = savedValue;
        }
    });
});

var container = document.getElementsByClassName('causes-container');


window.onload = next;
