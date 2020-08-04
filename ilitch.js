var options = {
        clientIdentifier: '9d27a879-ee0c-4653-8839-a4b2f6fa8023'
    }, penny,
    posts = [];
coinSound = new Audio();
coinSound.src = './coin.wav';
boosted = [];
var sdk = new twetchjs(options),
    outputs = [],
    cryptoOperations = [],
    loadingPost = false,
    selOrder = 0,
    tipUNum, loadingText = "Deschooling Society...";
sdk.storage.setItem('tokenTwetchAuth',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjUyIn0sImlhdCI6MTU5MjQwMTgxNH0.adZ_QsfshakYBNASIjMWQw46rh__8t8_f75n5I3w2jg'
);


document.getElementById("order").onchange = () => {
    selOrder = document.getElementById("order").value;
    localStorage.setItem('orderBy', selOrder);
    postsQuery();
}
if (localStorage.getItem('orderBy')) {
    selOrder = localStorage.getItem('orderBy');
    document.getElementById("order").options[selOrder].selected = true;
}

document.getElementById("tPost").setAttribute("disabled", null);
document.getElementById("post").addEventListener("keyup", function() { checkPost() })

function checkPost(){
    let input = document.getElementById("post").value;
    if (input != "") {
        document.getElementById("tPost").removeAttribute("disabled");
        if (input.length >= 256){document.getElementById("tPost").setAttribute("disabled",null)}
    } else {document.getElementById("tPost").setAttribute("disabled", null)}
}

async function setPennyAmt(){
                let price = localStorage.getItem("price");
                if (!price){price = await sdk.bsvPrice(); 
                localStorage.setItem("price", price)};
                penny = parseFloat((Math.ceil(1000000 / price) / 100000000).toFixed(8))
}

function savePermissionToken(token) {
    localStorage.setItem('imbToken', token)
}

function getPermissionForCurrentUser() {if (localStorage.getItem('token')) {return localStorage.getItem('token')}}

var twetches = document.getElementById("message-container");

async function build(content, action) {
    if (action === 'twetch/post@0.0.1') {var obj = {bContent: content}} else {var obj = {postTransaction: content}}
    const {abi, payees} = await sdk.build(action, obj);let twOutput = {};
    if (localStorage.getItem('wallet') === 'moneybutton'){twOutput = {currency: 'BSV',amount: 0,script: bsv.Script.buildSafeDataOut(abi.toArray()).toASM()}} 
    else if (localStorage.getItem('wallet') === 'relayx'){twOutput = {currency: 'BSV',amount: 0,signatures:['TWETCH-AIP'],script: bsv.Script.buildSafeDataOut(abi.args.slice(0, abi.args.length-5)).toASM()}}
    outputs = [twOutput].concat(payees);
    if (action === 'twetch/like@0.0.1'){
        outputs[2].to = 'zeroschool@moneybutton.com';outputs[2].amount += penny;
        if (outputs.length < 4){outputs[2].amount += (penny * 4)} else {outputs[3].amount += (penny * 4)}
    } else if (action === 'twetch/post@0.0.1'){outputs[2].to = 'zeroschool@moneybutton.com'; outputs[2].amount += 0.00001000}
    cryptoOperations = [
        {name: 'myAddress',method: 'address',key: 'identity'},
        {name: 'mySignature',method: 'sign',data: abi.contentHash(),dataEncoding: 'utf8',key: 'identity',algorithm: 'bitcoin-signed-message'}
    ];
}

function loadingDlg() {
    let dialog = document.getElementById('dlg');
    dialogPolyfill.registerDialog(dialog);
    dialog.innerHTML =
        `<form method="dialog" style="width: 230px; height:30px"><p id="loading">Deschooling society...</p><menu class="dialog-menu"></menu></form>`;
    let itoken = localStorage.getItem('imbToken');
    if (itoken === null) {
        return
    }
    dialog.showModal();
    loadingPost = true;
}

const imb = new moneyButton.IMB({permission: getPermissionForCurrentUser(),clientIdentifier: "ce4eb6ea41a4f43044dd7e71c08e50b2"});
async function send(action, likeTx, tipped) {
    if (tipped === true) {loadingText = 'Tipping';loadingDlg()}
    if (localStorage.getItem('wallet') === 'moneybutton'){
        imb.swipe({outputs,type: "tip",cryptoOperations,
        onPayment: async (payment) => {if (tipped === true) {coinSound.play(); loadingText = 'Loading'}
            await sdk.publishRequest({signed_raw_tx: payment.rawtx, action: action});
            if (action === 'twetch/post@0.0.1') {loadingPost = false; loadingText = 'Deschooling society..'; location.reload()}             
        }, onError: err => {console.log(err)}}).then(({payment}) => console.log(payment), 
        error => { console.log(error);
            if (action === 'twetch/post@0.0.1') {loadingPost = false; location.reload()}
            else {
                let likeCount = parseInt(document.getElementById(`${likeTx}_count`).innerText);
                document.getElementById(`${likeTx}_count`).innerText = likeCount - 1;
                document.getElementById(likeTx).className = `nes-icon heart is-large is-empty`;
            }
        })
    }
    else if (localStorage.getItem('wallet') === 'relayx'){console.log('outputs', outputs)
        let res = await relayone.send({outputs});
        if (res.txid){console.log(res);sdk.publishRequest({signed_raw_tx: res.rawTx, action: action})}
        if (tipped === true) {coinSound.play(); loadingText = 'Loading'}
        if (action === 'twetch/post@0.0.1') {loadingPost = false; loadingText = 'Deschooling society..'; location.reload()}
    }
}

async function getBoosts() {let res = await axios.get(`https://graph.boostpow.com/api/v1/main/boost/search?tag=${getTwetchSuffix()}`);boosted = res.data.mined}
function diffSum(content) {
    let boostedJobs = boosted.filter(boost => boost.boostData.content == content);
    let totalDiff = boostedJobs.reduce(function(sum, obj) {return sum + obj.boostJob.diff}, 0); return totalDiff;
}

function applyBoostSort(twPosts) {
    for (let i = 0; i < twPosts.length; i++) {
        let boostValue = diffSum(twPosts[i].transaction);
        twPosts[i].boostValue = boostValue;
    }
    posts = twPosts.filter(post => post.boostValue > 0);
}

async function postsQuery() {
    try {
        await getBoosts();
    } catch (e) {
        console.log(e)
    }
    document.getElementById('message-container').innerHTML = "";
    let orderBy = 'orderBy: CREATED_AT_DESC';
    if (selOrder === '1') {
        orderBy = 'orderBy: LIKES_BY_POST_ID__COUNT_DESC'
    };
    let filter = "";
    if (window.location.href == "https://www.zeroschool.org/jobs.html"){ filter = " /job"} else {filter = getTwetchSuffix()}
    let response = await sdk.query(`{
                allPosts(filter: {bContent: {includes: "${filter}"}}, ${selOrder === '2' ? "" : "first: 100,"} ${orderBy}) {
                    nodes {bContent transaction numLikes userId youLiked userByUserId {name icon}}
                }
            }`);

    posts = response.allPosts.nodes;

    if (selOrder === '2') {
        applyBoostSort(posts);
        posts.sort(compare)
    }
    for (let i = 0; i < posts.length; i++) {
        let content = posts[i].bContent.replace(getTwetchSuffix(), '');
        let boostValue = diffSum(posts[i].transaction);
        posts[i].boostValue = boostValue;
        let osTwetch = `<div class="nes-container with-title is-dark" style="position: relative; border-color: #777; background-color: #000000; margin-bottom: 20px;">
                        <p id="postTitle" class="title"><img class="nes-avatar is-rounded is-medium" src="${posts[i].userByUserId.icon}"> ${posts[i].userByUserId.name} <a href="https://twetch.app/u/${posts[i].userId}" target="_blank">u/${posts[i].userId}</a>
                        </p><p class="urlFormat">${applyURLs(content)}</p>`
        osTwetch += `<div class="item" style="position: relative; height: 110px;">
                        <i id="${posts[i].transaction}" class="nes-icon is-large heart ${posts[i].youLiked === "0" ? "is-empty" : ""}"></i><var id=${posts[i].transaction}_count style="position: absolute; left: 50px; top: 69px">${posts[i].numLikes}</var>
                        <a href="https://search.matterpool.io/tx/${posts[i].transaction}" target="_blank" text-decoration="none" class="txid">#txid</a>
                        <i class="nes-icon coin is-large" name="${posts[i].userId}" style="position: absolute; right: -15px; top: 25px"></i>
                        <i class="nes-icon trophy is-large ${boostValue === 0 ? "is-empty" : ""}" name="${posts[i].transaction}" style="position: absolute; left: 80px; top: 20px"></i>
                        <var id=${posts[i].transaction}_diff style="position: absolute; left: 148px; top: 69px">${parseInt(boostValue)}</var>
                    </div>`;
        document.getElementById('message-container').innerHTML += osTwetch + '</div>';
    }
    var hearts = document.getElementsByClassName("nes-icon is-large heart is-empty");
    for (let i = 0; i < hearts.length; i++) {
        hearts[i].addEventListener('click', like)
    }
    var coins = document.getElementsByClassName("nes-icon coin is-large");
    for (let j = 0; j < coins.length; j++) {
        coins[j].addEventListener('click', askTip)
    }
    var stars = document.getElementsByClassName("nes-icon trophy is-large");
    for (let k = 0; k < stars.length; k++) {
        stars[k].addEventListener('click', boost)
    }
}
postsQuery();

function boost() {
    boostPublish.open({
        content: this.getAttribute("name"),
        tag: getTwetchSuffix(),
        outputs: [{
            to: "zeroschool@moneybutton.com",
            amount: "0.00002138",
            currency: "BSV"
        }],
        onPayment: function(payment, boostJobStatus) {
            let boostTxt = `Boost PoW job queued!<br><br>
            <a href="https://boostpow.com/job/${payment.txid}" target="_blank" text-decoration="none">Your Boosted transaction awaits here</a>`;
            showPopup(boostTxt, 'Confirm', false);
        }
    });
}

function compare(a, b) {
    let aBoost = a.boostValue,
        bBoost = b.boostValue,
        comp = 0;
    if (aBoost < bBoost) {
        comp = 1
    } else if (aBoost > bBoost) {
        comp = -1
    }
    return comp;
}

function askTip() {
    let uNum = this.getAttribute("name");
    tipUNum = uNum,
        text = `Would you like to tip u/${uNum} 25 cents?`;
    showPopup(text, 'Confirm', true, "tip()");
}

async function like() {
    document.getElementById(this.id).className = `nes-icon heart is-large`;
    let likeCount = parseInt(document.getElementById(`${this.id}_count`).innerText);
    document.getElementById(`${this.id}_count`).innerText = likeCount + 1;
    await build(this.id, 'twetch/like@0.0.1');send('twetch/like@0.0.1', this.id);
}

function tip() {
    twetchPost(`/pay @${tipUNum} $0.25 from $zeroschool`);
    window.scrollTo(0, 0)
}

async function twetchPost(text) {
    let post = document.getElementById("post").value,
        tipped = false;
    if (text) {
        post = text;
        tipped = true
    } else {
        post += ` ${getTwetchSuffix()}`;
        loadingDlg()
    }
    document.getElementById("post").value = "";
    await build(post, 'twetch/post@0.0.1');
    await send('twetch/post@0.0.1', '', tipped);
}

setPennyAmt();

function youtube(content) {
    let youRegex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
    return content.replace(youRegex, function(url) {
        let id = url.slice(-11)
        return `<div class="video-container" align="center"><iframe title="YouTube video player" src="https://youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe></div>`;
    })
}

function streamanity(content) {
    let strmRegex = /http(s)?:\/\/(.*\.)?streamanity\.com\/video\/([A-z0-9_/?=-]+)/;
    return content.replace(strmRegex, function(url) {
        let id = url.slice(30);
        console.log(id)
        return `<div class="video-container" align="center"><iframe title="Streamanity" src="https://streamanity.com/embed/${id}" frameborder="0"  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
    })
}

function applyURLs(content) {
    if (content.indexOf("https://media.bitcoinfiles.org/") >= 0) {
        let index = content.indexOf("https://media.bitcoinfiles.org/")
        let url = content.substring(index, index + 95);
        let filesLink = `<div><a href="${url}"><img src="${url}" style="max-width: 100%; height: auto;"></a></div>`;
        let newContent = content.replace(url, filesLink);
        return newContent;
    } else if (content.indexOf("youtu") >= 0) {
        return youtube(content)
    } else if (content.indexOf("streamanity.com") >= 0) {
        return streamanity(content)
    } else {
        var urlRegex = /(https?:\/\/[^\s]+)/g;
        return content.replace(urlRegex, function(url) {
            return '<a href="' + url + '"target="_blank">' + url + '</a>'
        })
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker.js').then(function(registration) {
        console.log('Registration successful, scope is:', registration.scope)
    }).catch(function(error) {
        console.log('Service worker registration failed, error:', error)
    });
}

function showPopup(text, confirm, cancel, onClick) {
    let dialog = document.getElementById('dlg');
    dialogPolyfill.registerDialog(dialog);
    dialog.innerHTML = `<form method="dialog"><p>${text}</p>
            <menu class="dialog-menu">
                ${cancel === true ? "<button class='btn btn-error btn-ghost cancel'>Cancel</button>" : ""}
                <button class="btn btn-primary btn-ghost confirm" onclick="${onClick}">${confirm}</button>
            </menu></form>`;
    dialog.showModal();
}

function getTwetchSuffix() {
        let currentPage = window.location.href;
        if (currentPage == "https://www.zeroschool.org/100p.html"){return "$100p"} else {return "$zeroschool"}
}

var dots = window.setInterval(function() {
    let wait = document.getElementById("loading");
    if (loadingPost === true) {
        if (wait.innerHTML.length > loadingText.length + 3) {
            wait.innerHTML = loadingText
        } else {
            wait.innerHTML += "."
        }
    }
}, 300);

window.addEventListener('DOMContentLoaded', () => {
    const parsedUrl = new URL(window.location);
    document.getElementById("post").value = parsedUrl.searchParams.get('text');
    checkPost();
});
