function populateHTML(nPosts){
    for (let i = 0; i<nPosts; i++){
        document.getElementById('message-container').innerHTML +=
        `<div class="nes-container with-title is-dark twetch" style="height:auto;"position: relative; border-color: #777; background-color: #000000; margin-bottom: 20px;">
        <p class="profile"><img class="nes-avatar is-rounded is-medium"></p>
        <p text-decoration="none" class="username"><a class="userLink" href="" target="_blank"></a></p>
        <p class="postContent urlFormat"></p>
            <div class="item">
                <i class="nes-icon heart is-large is-empty"></i><var class="numLikes"></var>
                <a target="_blank" class="txid">#tx</a>
                <i class="nes-icon star is-large is-empty"></i><var class="boostValue"></var>                 
            </div>
        </div>`
    }
}
function info(){
        showPopup(`<p class="title" style="color: #21e800; font-family: fixedsys_excelsior_3.01Rg;">Welcome to ZeroSchool!</p><p style="font-family: fixedsys_excelsior_3.01Rg">ZeroSchool is a state of the art fren-2-fren Education System built for the 22nd Century.<br><br>
            Posts, likes, tipping, & Boost are currently supported along with Bitcoinfiles.<br><br>
            Likes are 10 cents.<br><br>
            You'll need a <a href="https://twetch.app">Twetch</a> account to get you started, so grab an invite here: <a href="https://twet.ch/inv/zeroschool">https://twet.ch/inv/zeroschool</a> , or don't, whatever..<br><br>
               <blockquote style="color:#21e800">"Most learning is not the result of instruction. It is rather the result of unhampered participation in a <b>meaningful setting</b>.
Most people learn by being "with it", yet school makes them identify their, cognitive growth with elaborate planning and manipulation." - <i>Ivan Ilitch, <u>Deschooling society</u></i></blockquote>
            <br>
            Post, Discuss, Rate real world problems, Learn by doing, and get paid. What are you waiting for?<br><br>
            More to come, or not...</p>`, 'Enter', false)
    }
function goToTwetch(){
    window.open("https://twetch.app/t" + this.transaction)
}

function showPopup(text, confirm, cancel, onClick) {
    let dialog = document.getElementById('infoDlg');
    dialogPolyfill.registerDialog(dialog);
    dialog.innerHTML = `<form method="dialog"><p>${text}</p>
            <menu class="dialog-menu">
                ${cancel === true ? "<button class='btn btn-error btn-ghost cancel'>Cancel</button>" : ""}
                <button class="btn btn-primary btn-ghost confirm" onclick="${onClick}">${confirm}</button>
            </menu></form>`;
    dialog.showModal();
}

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

async function twgin(){
    if (localStorage.getItem('token')){
        if (sdk.storage.getItem('tokenTwetchAuth')){sdk.authenticated = true}
        else {
            let r = axios.post('https://auth.twetch.app/api/v1/authenticate', {
                address: localStorage.getItem('address'),message: localStorage.getItem('msg'),signature: localStorage.getItem('signature')
                }).then(async function (res){sdk.storage.setItem('tokenTwetchAuth', res.data.token);
                sdk.authenticated = true;
                await sdk.authenticate()})   
        }
    }
    if (sdk.authenticated){
        document.getElementById("btnLogin").style.display = "none";
        document.getElementById("btnLogout").style.display = "inline";} else {
        document.getElementById("btnLogin").style.display = "inline";
        document.getElementById("btnLogout").style.display = "none"}
}

function login(){
    dialog = document.getElementById("loginDlg");
    dialogPolyfill.registerDialog(dialog);dialog.showModal();
}

    const zeroURL = "https://zeroschool.org";
    function logout(){localStorage.clear();alert("Logged out!");location.reload()}
    async function relayXLogin(){
        let token = await relayone.authBeta({withGrant:true}), res;
        localStorage.setItem('token', token);
        let [payload, signature] = token.split(".");
        const data = JSON.parse(atob(payload));
        let content = await axios.get('https://auth.twetch.app/api/v1/challenge');
        localStorage.setItem('msg', content.data.message);
        try {res = await relayone.sign(content.data.message)}catch(e){alert(e)}
        let publicKey = bsv.PublicKey.fromHex(data.pubkey);
        let signAddr = bsv.Address.fromPublicKey(publicKey);
        if (res){saveWallet(data.paymail, data.pubkey, res.value, signAddr.toString(), 'relayx')}
        if (localStorage.getItem('paymail')){window.location.href = zeroURL}
    }
    function saveWallet(paymail, pubkey, signature, address, wallet){
        localStorage.setItem('paymail', paymail);
        localStorage.setItem('pubkey', pubkey);
        localStorage.setItem('signature', signature);
        localStorage.setItem('address', address);
        localStorage.setItem('wallet', wallet);
    }
    function savePermissionToken(token) {localStorage.setItem('token', token)}
    function getPermissionForCurrentUser() {if (localStorage.getItem('token')) {return localStorage.getItem('token')}}
    const imb = new moneyButton.IMB({
        clientIdentifier: "ce4eb6ea41a4f43044dd7e71c08e50b2",
        permission: getPermissionForCurrentUser(), onNewPermissionGranted: (token) => savePermissionToken(token)
    });
    async function imbLogin(){
        let content = await axios.get('https://auth.twetch.app/api/v1/challenge');
        localStorage.setItem('msg', content.data.message);
        var cryptoOperations = [
            {name:'mySignature',method:'sign',data:localStorage.getItem('msg'),dataEncoding:'utf8',key:'identity',algorithm:'bitcoin-signed-message'},
            {name:'myPublicKey',method:'public-key',key:'identity'},{name: 'myAddress',method: 'address',key: 'identity'}
        ];
        imb.swipe({cryptoOperations: cryptoOperations,
            onCryptoOperations: (ops) => {
                saveWallet(ops[1].paymail, ops[1].value, ops[0].value, ops[2].value, 'moneybutton');
                if (localStorage.getItem('paymail')){window.location.href = zeroURL}
            }
        });
    }

document.getElementById("order").onchange = () => {selOrder = document.getElementById("order").value;localStorage.setItem('orderBy', selOrder);postsQuery()}
if (localStorage.getItem('orderBy')) {selOrder = localStorage.getItem('orderBy');document.getElementById("order").options[selOrder].selected = true}
document.getElementById("tPost").setAttribute("disabled", null);document.getElementById("post").addEventListener("keyup", function() {checkPost()})

postsQuery();
setPennyAmt();

function checkPost(){
    let input = document.getElementById("post").value;
    if (input != "") {
        document.getElementById("tPost").removeAttribute("disabled");
        if (input.length >= 256){document.getElementById("tPost").setAttribute("disabled",null)}
    } else {document.getElementById("tPost").setAttribute("disabled", null)}
}

async function setPennyAmt(){let price = localStorage.getItem("price");if (!price){price = await sdk.bsvPrice(); localStorage.setItem("price", price)};penny = parseFloat((Math.ceil(1000000 / price) / 100000000).toFixed(8))}
function getPermissionForCurrentUser() {if (localStorage.getItem('token')) {return localStorage.getItem('token')}}

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

function loadingDlg(){
    let dialog = document.getElementById('loadingDlg');
    dialogPolyfill.registerDialog(dialog);
    dialog.innerHTML = `<form method="dialog" class="loading"><p id="loading">Deschooling society...</p><menu class="dialog-menu"></menu></form>`;
    dialog.showModal(); loadingPost = true;
}

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

async function postsQuery(){
    try{await getBoosts()} catch(e){console.log(e)};
    document.getElementById('message-container').innerHTML = "";
    let orderBy = 'orderBy: CREATED_AT_DESC';
    if (selOrder === '1') {orderBy = 'orderBy: LIKES_BY_POST_ID__COUNT_DESC'}
    let filter = "";
    if (window.location.href.includes("zeroschool.org/jobs")){ filter = "/job "} else {filter = getTwetchSuffix()}
    let response = await sdk.query(`{
                allPosts(filter: {bContent: {includes: "${filter}"}}, ${selOrder === '2' ? "" : "first: 100,"} ${orderBy}) {
                    nodes {bContent transaction numLikes userId youLiked userByUserId {name icon}}
                }
            }`);
    posts = response.allPosts.nodes;
    if (selOrder === '2') {applyBoostSort(posts);posts.sort(compare)}populateHTML(posts.length);
    let profiles = document.getElementsByClassName("nes-avatar"),userLinks = document.getElementsByClassName("userLink"),postTitles = document.getElementsByClassName("title profile");
    let contents = document.getElementsByClassName("postContent"),hearts = document.getElementsByClassName("heart"),likes = document.getElementsByClassName("numLikes");    
    let txids = document.getElementsByClassName("txid"), stars = document.getElementsByClassName("nes-icon star is-large"), boostValues = document.getElementsByClassName("boostValue");
    let twetches = document.getElementsByClassName("twetch");
    for (let i=0; i<posts.length;i++){
        content = posts[i].bContent.replace(getTwetchSuffix(), ''), boostValue = diffSum(posts[i].transaction); posts[i].boostValue = boostValue;
        if (content.indexOf("twetch.app/t") >= 0){
            let twetchRegex = /http(s)?:\/\/(.*\.)?twetch\.app\/t\/([A-z0-9_/?=]+)/;
            let branchURL = content.match(twetchRegex)[0];
            let branchTxID = branchURL.slice(-64);
            let response = await sdk.query(`{
              postByTransaction(transaction: "${branchTxID}") {
                bContent
                numLikes
                transaction
                userId
                youLiked
                userByUserId {
                  icon
                  name
                }
              }
            }`);
            let branch = response.postByTransaction;
            content = branch.bContent.replace(getTwetchSuffix(),''), boostValue = diffSum(branch.transaction); branch.boostValue = boostValue;
            profiles[i].src = branch.userByUserId.icon;userLinks[i].innerHTML = ` ${branch.userByUserId.name} u/${branch.userId}`;userLinks[i].href = `https://twetch.app/u/${branch.userId}`;
            contents[i].innerHTML = applyURLs(content);likes[i].innerHTML = branch.numLikes;likes[i].id = `${branch.transaction}_count`;
            hearts[i].id = branch.transaction;
            twetches[i].id = branch.transaction;
            if (branch.youLiked === "1"){hearts[i].className = 'nes-icon heart is-large'}
            txids[i].href = "https://search.matterpool.io/tx/" + branch.transaction;
            stars[i].setAttribute("name", branch.transaction);}
        else {
            profiles[i].src = posts[i].userByUserId.icon;userLinks[i].innerHTML = ` ${posts[i].userByUserId.name} u/${posts[i].userId}`;userLinks[i].href = `https://twetch.app/u/${posts[i].userId}`;
            contents[i].innerHTML = applyURLs(content);likes[i].innerHTML = posts[i].numLikes;likes[i].id = `${posts[i].transaction}_count`;
            hearts[i].id = posts[i].transaction;
            twetches[i].id = posts[i].transaction;
            if (posts[i].youLiked === "1"){hearts[i].className = 'nes-icon heart is-large'}
            txids[i].href = "https://search.matterpool.io/tx/" + posts[i].transaction;
            stars[i].setAttribute("name", posts[i].transaction);}
        if (boostValue > 0){stars[i].className = 'nes-icon star is-large'};boostValues[i].innerHTML = parseInt(boostValue);
        twetches[i].addEventListener('click', goToTwetch);
        hearts[i].addEventListener('click', like);
        stars[i].addEventListener('click', boost);
    }
}

function goToTwetch() {
    window.open("https://twetch.app/t/" + this.id);
}

function getTwetchSuffix() {
    let currentPage = window.location.href;
    if (currentPage.includes("zeroschool.org/100p")){return "$100p"} else {return "$zeroschool"}
}

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

async function like() {
    document.getElementById(this.id).className = `nes-icon heart is-large`;
    let likeCount = parseInt(document.getElementById(`${this.id}_count`).innerText);
    document.getElementById(`${this.id}_count`).innerText = likeCount + 1;
    await build(this.id, 'twetch/like@0.0.1');send('twetch/like@0.0.1', this.id);
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

