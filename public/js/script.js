

const emotions = ['happiness', 'sadness', 'disgust', 'surprise', 'fear', 'anger'];
let selections = JSON.parse(localStorage.getItem('clauseSelections')) || {};
let currentPage = 0;
let totalPages = 0;

function loadAndDisplayJSON() {
    fetch('/resource/fold7_test.json')
        .then(response => response.json())
        .then(data => {
            totalPages = data.length;
            document.getElementById('total-pages').innerText = ' of ' + totalPages;
            displayPage(data, currentPage);
            setupPagination(data);
        })
        .catch(error => console.error('Error loading JSON:', error));
}
function changePage(data, increment) {
    let newPage = currentPage + increment;
    if (newPage >= 0 && newPage < data.length) {
        currentPage = newPage;
        displayPage(data, currentPage);
    }
}
function setupPagination(data) {
    document.getElementById('prev').addEventListener('click', () => changePage(data, -1));
    document.getElementById('next').addEventListener('click', () => changePage(data, 1));
    document.getElementById('page-number-input').addEventListener('change', (event) => {
        const newPage = parseInt(event.target.value, 10) - 1;
        if (newPage >= 0 && newPage < totalPages) {
            currentPage = newPage;
            displayPage(data, currentPage);
        }
    });
}

function displayPage(data, pageIndex) {
    let contentDiv = document.getElementById('content');
    contentDiv.innerHTML = '';
    if (pageIndex >= 0 && pageIndex < data.length) {
        let doc = data[pageIndex];
        let docDiv = document.createElement('div');
        docDiv.className = 'doc';
        let header = document.createElement('div');
        header.className = 'doc-header';
        header.innerText = 'Document ID: ' + doc.doc_id;
        docDiv.appendChild(header);

        doc.clauses.forEach((clause, index) => {
            let clauseDiv = document.createElement('div');
            clauseDiv.className = 'clause';
            let clauseText = document.createElement('div');
            clauseText.className = 'clause-text';
            clauseText.innerText = (index + 1) + ". " + clause.clause;
            clauseDiv.appendChild(clauseText);

            let emotionSelect = createEmotionSelect();
            clauseDiv.appendChild(emotionSelect);

            let causesContainer = document.createElement('div');
            causesContainer.className = 'causes-container';
            clauseDiv.appendChild(causesContainer);


            let addButton = document.createElement('button');
            addButton.className = 'add-cause';
            let icon = document.createElement('i');
            icon.className = 'fas fa-plus';
            addButton.appendChild(icon);
            addButton.addEventListener('click', () => addCauseAndScore(causesContainer));
            clauseDiv.appendChild(addButton);


            let deleteButton = document.createElement('button');
            deleteButton.className = 'delete-cause';
            let deleteicon = document.createElement('i');
            deleteicon.className = 'fas fa-minus';
            deleteButton.appendChild(deleteicon);
            deleteButton.addEventListener('click', () => deleteCauseAndScore(causesContainer));
            clauseDiv.appendChild(deleteButton);

            docDiv.appendChild(clauseDiv);
        });

        contentDiv.appendChild(docDiv);
    }
    document.getElementById('page-number-input').value = pageIndex + 1;
}


function createEmotionSelect() {
    let select = document.createElement('select');
    select.className = 'emotion-select';


    let defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.text = "null";
    select.appendChild(defaultOption);

    const emotions = ['happiness', 'sadness', 'disgust', 'surprise', 'fear', 'anger'];


    emotions.forEach(emotion => {
        let option = document.createElement('option');
        option.value = emotion;
        option.text = emotion;
        select.appendChild(option);
    });

    select.addEventListener('change', function () {
        localStorage.setItem(select.id, select.value);
    });

    return select;
}


function addCauseAndScore(container) {

    causenumber = container.querySelectorAll('.cause-select').length;
    if (causenumber >= 4) {
        return;
    }

    const allClausesTexts = Array.from(document.querySelectorAll('.clause-text')).map(clauseElem => {
        return clauseElem.innerText;
    });

    let causeSelect = createCauseSelect(allClausesTexts);
    container.appendChild(causeSelect);

    let scoreSelect = createScoreSelect();
    container.appendChild(scoreSelect);


}


function deleteCauseAndScore(container) {
    if (container.lastChild) {
        container.removeChild(container.lastChild);
    }
    if (container.lastChild) {
        container.removeChild(container.lastChild);
    }

}



function createCauseSelect(allClausesTexts) {
    let select = document.createElement('select');
    select.className = 'cause-select';


    let nullOption = document.createElement('option');
    nullOption.value = '';
    nullOption.text = '選擇原因子句';
    select.appendChild(nullOption);


    allClausesTexts.forEach((clauseText, index) => {
        let option = document.createElement('option');
        option.value = (index + 1).toString();
        option.text = clauseText;
        select.appendChild(option);
    });

    select.addEventListener('change', function () {
        localStorage.setItem(select.id, select.value);
    });
    return select;
}

function createScoreSelect(selectedScore, index) {
    let select = document.createElement('select');
    select.className = 'score-select';

    // 添加空選項
    let emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.text = '選擇相關程度';
    select.appendChild(emptyOption);

    // 分數範圍1-3
    for (let i = 1; i <= 3; i++) {
        let option = document.createElement('option');
        option.value = i.toString();
        if (i === 1) {
            option.text = '低度相關';
        } else if (i === 2) {
            option.text = '中度相關';
        } else {
            option.text = '高度相關';
        }
        option.selected = i.toString() === selectedScore;
        select.appendChild(option);
    }

    return select;
}

document.getElementById('save-form').addEventListener('click', function () {
    const username = document.getElementById('username').value || 'unknown_user';
    const docId = document.querySelector('.doc-header').innerText.split(': ')[1] || 'unknown';
    const allClauses = document.querySelectorAll('.clause');
    const data = {
        doc_id: docId,
        user: username,
        clauses: []
    };

    allClauses.forEach((clauseElement, index) => {
        const clauseData = {
            clause_id: index + 1,
            emotion: getValue(clauseElement, '.emotion-select'),
            causes: {},
            scores: {}
        };

        const causeSelects = clauseElement.querySelectorAll('.cause-select');
        const scoreSelects = clauseElement.querySelectorAll('.score-select');

        causeSelects.forEach((select, selectIndex) => {
            clauseData.causes['cause' + (selectIndex + 1)] = select.value || null;
        });

        scoreSelects.forEach((select, selectIndex) => {
            clauseData.scores['score' + (selectIndex + 1)] = select.value || 0;
        });

        data.clauses.push(clauseData);
    });

    fetch('https://web.lab214b.uk:10000/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            alert('表單已成功提交');
            console.log('Success:', data);
        })
        .catch((error) => {
            alert('表單上傳失敗');
            console.error('Error:', error);
        });
});



function getValue(parentElement, selector) {
    const element = parentElement.querySelector(selector);
    return element && element.value ? element.value : null;
}

// function downloadObjectAsJson(exportObj, exportName) {
//     var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
//     var downloadAnchorNode = document.createElement('a');
//     downloadAnchorNode.setAttribute("href", dataStr);
//     downloadAnchorNode.setAttribute("download", exportName + ".json");
//     document.body.appendChild(downloadAnchorNode); // required for firefox
//     downloadAnchorNode.click();
//     downloadAnchorNode.remove();
// }

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('select').forEach(select => {
        const savedValue = localStorage.getItem(select.id);
        if (savedValue) {
            select.value = savedValue;
        }
    });
});

window.onload = loadAndDisplayJSON;
