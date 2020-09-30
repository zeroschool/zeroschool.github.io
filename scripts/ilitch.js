const inReplyTo = 'b3ab98273886ffa0dc2b312514e58b1dc8049a799d9eea47de60531b8eb30b17'; // Twetch ZeroSchool: I wanna learn _____
const publicVapidKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjUyIn0sImlhdCI6MTU5MjQwMTgxNH0.adZ_QsfshakYBNASIjMWQw46rh__8t8_f75n5I3w2jg';
const savePermissionToken = (token) => {
    localStorage.setItem('token', token);
}
const getPermissionForCurrentUser = () => {
    if (localStorage.getItem('token')) {
        return localStorage.getItem('token');
    }
}
const imbCli = window.location.href.includes('localhost') ? 'ee9db2a1a7003d2f2f6798eb4616f2fd' : 'ce4eb6ea41a4f43044dd7e71c08e50b2';
const imb = new moneyButton.IMB({
    clientIdentifier: imbCli,
    permission: getPermissionForCurrentUser(), 
    onNewPermissionGranted: (token) => savePermissionToken(token)
});
var sdk = new twetchjs({ clientIdentifier: '9d27a879-ee0c-4653-8839-a4b2f6fa8023' });
var coinSound = new Audio(); coinSound.src = '/assets/resources/coin.wav', dialog = {}, loadingLike = false;
//var outputs = [], cryptoOperations = [], loadingPost = false, selOrder = 0, fileTwetch = 0, loadingText = "Deschooling society";
var outputs = [], cryptoOperations = [], loadingPost = false, selOrder = 0, loadingText = "Deschooling society";
async function twgin() {
    if (localStorage.getItem('tokenTwetchAuth')) {
        sdk.authenticated = true;
        await sdk.authenticate();
        await fetchTwetches(sdk, 0, inReplyTo);
        //await fetchTwetches(sdk, localStorage.getItem('orderBy') !== undefined ? localStorage.getItem('orderBy') : 0);
    } else {
        window.location.href = "/welcome";
    }
}
twgin();
document.getElementById("order").onchange = () => {
    selOrder = document.getElementById("order").value;
    localStorage.setItem('orderBy', selOrder);
    fetchTwetches(sdk, selOrder, inReplyTo);
}
if (localStorage.getItem('orderBy')) {
    selOrder = localStorage.getItem('orderBy');
    document.getElementById("order").options[selOrder].selected = true;
}
document.getElementById("tPost").setAttribute("disabled", null);
document.getElementById("post").addEventListener("keyup", () => {checkPost()})
function checkPost(){
    let input = document.getElementById("post").value;
    if (input != "") {
        document.getElementById("tPost").removeAttribute("disabled");
        if (input.length >= 256) {
            document.getElementById("tPost").setAttribute("disabled", null);
        }
    } else {
        document.getElementById("tPost").setAttribute("disabled", null);
    }
}
async function getPenny() {
    let price = await sdk.bsvPrice();
    let penny = parseFloat((Math.ceil(1000000 / price) / 100000000).toFixed(8));
    return penny;
}

async function build(content, action, tipped) {
    let obj, twOutput;
    if (action === 'twetch/post@0.0.1') {
       if (tipped){
          obj = {bContent: content}
       } else {
        obj = {bContent: content,
              mapReply: inReplyTo}
       }
    } else {
        obj = {postTransaction: content}
    }
    const {abi, payees} = await sdk.build(action, obj);
    if (localStorage.getItem('wallet') === 'moneybutton') {
        twOutput = {currency: 'BSV',amount: 0,script: arrToScript(abi.toArray())}
    } 
    else if (localStorage.getItem('wallet') === 'relayx') {
        twOutput = {currency: 'BSV',amount: 0,signatures:['TWETCH-AIP'],script: arrToScript(abi.args.slice(0, abi.args.length-5))}
    }
    outputs = [twOutput].concat(payees);
    if (action === 'twetch/like@0.0.1'){
        outputs[2].to = '16bKbvsXc279ZTgvjgTQ29JezjQ3sRVA8N';
        let penny = await getPenny();
        outputs[2].amount += penny;
        if (outputs.length < 4) {
            outputs[2].amount += (penny * 4);
        } 
        else {
            outputs[3].amount += (penny * 4);
        }
    } else if (action === 'twetch/post@0.0.1'){
        outputs[2].to = '16bKbvsXc279ZTgvjgTQ29JezjQ3sRVA8N';
        outputs[2].amount += 0.00001000
    }
    cryptoOperations = [
        {name: 'myAddress', method: 'address', key: 'identity'},
        {name: 'mySignature', method: 'sign', data: abi.contentHash(), dataEncoding: 'utf8', key: 'identity', algorithm: 'bitcoin-signed-message'}
    ];
}
async function send(action, likeTx, tipped, count) {
    if (tipped === true) {
        loadingText = 'Tipping';
        loadingDlg();
    }
    if (localStorage.getItem('wallet') === 'moneybutton') {
        imb.swipe({
            outputs,
            cryptoOperations,
            onPayment: async (payment) => {
                if (tipped === true) {
                    coinSound.play();
                    loadingText = 'Loading';
                }
                await sdk.publishRequest({signed_raw_tx: payment.rawtx, action: action});
                if (action === 'twetch/post@0.0.1') {
                    loadingPost = false;
                    loadingText = 'Deschooling society';
                    location.reload();
                }
                else if (action === 'twetch/like@0.0.1') {
                    loadingLike = false;
                    document.getElementById(likeTx).className = `nes-icon heart is-medium`;
                    document.getElementById(`${likeTx}_count`).innerText = count + 1;
                }            
            }, 
            onError: err => {
                console.log(err);
            }})
            .then(({ payment }) => console.log(payment), error => { console.log(error);
            if (action === 'twetch/post@0.0.1') {loadingPost = false; location.reload()}
            else {
                if (document.getElementById(`${likeTx}_count`) !== null) {
                    let likeCount = parseInt(document.getElementById(`${likeTx}_count`).innerText);
                    document.getElementById(`${likeTx}_count`).innerText = likeCount - 1;
                    document.getElementById(likeTx).className = `nes-icon heart is-large is-empty`;
                }
            }
        })
    }
    else if (localStorage.getItem('wallet') === 'relayx') {
        let res = await relayone.send({ outputs });
        if (res.txid) {
            sdk.publishRequest({signed_raw_tx: res.rawTx, action: action});
        }
        if (tipped === true) {
            coinSound.play();
            loadingText = 'Loading';
        }
        if (action === 'twetch/post@0.0.1') {
            loadingPost = false;
            loadingText = 'Deschooling society';
            location.reload();
        }
        else if (action === 'twetch/like@0.0.1') {
            loadingLike = false;
            document.getElementById(likeTx).className = `nes-icon heart is-medium`;
            document.getElementById(`${likeTx}_count`).innerText = count + 1;
        }
    }
}

function loadingDlg() {
    dialog = document.getElementById('dlg');
    if (dialog == null){
       dialog = document.createElement("dialog");
       dialog.setAttribute("id", "dlg");
       dialog.setAttribute("class", "nes-dialog");
       dialog.innerHTML = `<form method="dialog" class="loading"><p id="loading">Deschooling society</p><menu class="dialog-menu"></menu></form>`;
       document.body.appendChild(dialog);
    }
    dialogPolyfill.registerDialog(dialog);
    dialog.showModal(); loadingPost = true;
}

function askTip() {
    let uNum = this.getAttribute("name");
    dialog = document.getElementById('tipDlg');
    if (dialog == null){
       dialog = document.createElement("dialog");
       dialog.setAttribute("id", "tipDlg");
       dialog.setAttribute("class", "nes-dialog");
       dialog.innerHTML += `<form method="dialog"><menu class="dialog-menu">
            <label for="tipAmt" id="tipLabel" style="color:#fff;"></label>
            <input type="text" id="tipAmt" class="nes-input is-dark" placeholder="$ + Tip amount in USD" value="$0.25">
            <button id="tipCancel" class='nes-btn is-error'>Cancel</button><button class="nes-btn is-success" id="tipConfirm">Confirm</button>
       </menu></form>`;
       document.body.appendChild(dialog);
    }
    dialogPolyfill.registerDialog(dialog);
    document.getElementById("tipLabel").innerHTML = `How much would you like to tip u/${uNum}?`;
    document.getElementById('tipConfirm').onclick = () => {
        tip(uNum);
    }
    document.getElementById('tipCancel').onclick = () => {
        console.log("Closing ask tip dialog");
        dialog.close();
    }
    dialog.showModal();
}
async function like() {
    let heart = document.getElementById(this.id);
    loadingLike = true;
    window.setInterval(() => {
        if (loadingLike) {
            if (heart.className.includes('is-empty')) {
                heart.className = 'nes-icon heart is-medium is-half';
            }
            else if (heart.className.includes('half')) {
                heart.className = 'nes-icon heart is-medium';
            }
            else {
                heart.className = 'nes-icon heart is-medium is-empty';
            }
        }
        else {
            return;
        }
    }, 400);
    let likeCount = parseInt(document.getElementById(`${this.id}_count`).innerText);
    await build(this.id, 'twetch/like@0.0.1', False);
    await send('twetch/like@0.0.1', this.id, false, likeCount);
}
function tip(tipU) {
    let amt = document.getElementById('tipAmt').value;
    if (amt.charAt(0) != '$'){
        amt = '$'+amt
    }
    twetchPost(`/pay @${tipU} ${amt} from $zeroschool`);
    window.scrollTo(0,0)
}
async function twetchPost(text) {
    let post = document.getElementById("post").value, tipped = false;
    if (text) {
        post = text;
        tipped = true;
    } 
    else {
        loadingDlg();
    }
    await build(post,'twetch/post@0.0.1', tipped);
    await send('twetch/post@0.0.1', '', tipped);
    document.getElementById("post").value = "";
}
function showPopup(text, confirm, cancel, onClick, lock){
    dialog = document.getElementById('dlg');
    dialogPolyfill.registerDialog(dialog);
    if (lock) {
        dialog.innerHTML = `<form method="dialog"><p>${text}</p><menu class="dialog-menu"></menu></form>`;
    } 
    else {
        dialog.innerHTML = `<form method="dialog"><p>${text}</p><menu class="dialog-menu">
        ${cancel === true ? "<button class='nes-btn is-error'>Cancel</button>" : ""}
        <button class="nes-btn is-primary" onclick="${onClick}">${confirm}</button></menu></form>`;
    }
    dialog.showModal();
}
var dots = window.setInterval(() => {
    let wait = document.getElementById("loading");
    if (loadingPost === true) {
        if (wait.innerHTML.length > loadingText.length + 3) {
            wait.innerHTML = loadingText;
        } 
        else {
            wait.innerHTML += ".";
        }
    }
}, 300);
window.addEventListener('DOMContentLoaded', () => {
    const parsedUrl = new URL(window.location);
    document.getElementById("post").value = parsedUrl.searchParams.get('text');
    checkPost();
});
window.onclick = function(event) {
    if (event.target == dialog) {
        dialog.close();
    }
}
if ('serviceWorker' in navigator) {
    sendSW().catch(e => {
        console.log('send service worker error: ', e);
    })
}
async function sendSW() {
    const register = await navigator.serviceWorker.register('/serviceworker.js', {
        scope: '/'
    });
    console.log('Registration successful, scope is:', register.scope);
    const subscription = await register.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
    console.log('Push registered.');
    fetch('/subscribe', {
        method: 'post',
        body: JSON.stringify({
            userId: localStorage.getItem('uId'),
            sub: subscription
        }),
        headers: { 'content-type': 'application/json' }
    });
}

const ascii_to_hexa = (str) => {
    var arr1 = [];
    for (var n = 0, l = str.length; n < l; n ++) 
    {
        var hex = Number(str.charCodeAt(n)).toString(16);
        arr1.push(hex);
    }
    return arr1.join('');
}
const arrToScript = (arr) => {
    let script = '0 OP_RETURN';
    for (let i=0; i<arr.length; i++) {
        script += ' ' + ascii_to_hexa(arr[i]);
    }
    return script;
}
const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
const timeago = (ms) => {
    ms = Date.now() - ms;
    let ago = Math.floor(ms / 1000);
    let part = 0;
    if (ago < 15) { return "just now"; }
    if (ago < 60) { return ago + " sec"; }
    if (ago < 120) { return "1 min"; }
    if (ago < 3600) {
        while (ago >= 60) { ago -= 60; part += 1; }
        return part + " min.";
    }
    if (ago < 7200) { return "1 hr"; }
    if (ago < 86400) {
        while (ago >= 3600) { ago -= 3600; part += 1; }
        return part + " hrs";
    }
    if (ago < 172800) { return "1 day"; }
    if (ago < 604800) {
        part = parseInt(ago / 86400);
        return part + " day(s)";
    }
    if (ago < 1209600) { return "1 wk"; }
    if (ago < 2592000) {
        while (ago >= 604800) { ago -= 604800; part += 1; }
        return part + " wks";
    }
    if (ago < 5184000) { return "1 mth"; }
    if (ago < 31536000) {
        while (ago >= 2592000) { ago -= 2592000; part += 1; }
        return part + " mths";
    }
    if (ago < 1419120000) {
        return ">1 yr";
    }
    return "Not yet";
}
const populateHTML = (count) => {
    for (let i = 0; i < count; i++){
        document.getElementById('message-container').innerHTML +=
        `<div class="nes-container is-rounded with-title is-dark twetch">
        <p class="profile"><img class="nes-avatar is-rounded is-medium"></p>
        <p><a class="userLink" href="" target="_blank"></a></p>
        <span class="timeago"></span>
        <i class="nes-icon coin is-medium nes-pointer"></i>
        <p class="postContent urlFormat"></p>
            <div class="item">
                <i class="nes-icon heart is-medium is-empty"></i><var class="numLikes"></var>
                <!--<button type="button" class="nes-btn share">Share</button>-->
                <a target="_blank" class="txid">#tx</a>
                <!--<i class="nes-icon star is-medium is-empty nes-pointer"></i>-->
                <!--<var class="boostValue"></var>-->
            </div>
        </div>`
    }
}
const compare = (a,b) => {
    let aBoost = a.boostValue, bBoost = b.boostValue, comp = 0;
    if (aBoost < bBoost) {comp = 1} 
    else if (aBoost > bBoost) {comp = -1} 
    return comp;
}
const fetchTwetches = async(sdk, selOrder, rootTx) => {
    // Make sure #message-container exists
    let $container = document.getElementById("message-container");
    if ($container == null) {
        $container = document.createElement("div");
        $container.setAttribute("id", "message-container");
        document.body.appendChild($container);
    }

    let orderBy = 'orderBy: CREATED_AT_DESC', response = '';
    if (selOrder === '1') {
        orderBy = 'orderBy: LIKES_BY_POST_ID__COUNT_DESC';
    };
        
    response = await sdk.query(`{
          allPosts(condition: {transaction: "${rootTx}"}, ${orderBy}) {
            nodes {
              bContent
              createdAt
              numLikes
              transaction
              userId
              youLiked
              userByUserId {
                icon
                name
              }
              children(filter: {postByReplyPostId: {transaction: {equalTo: "${rootTx}"}}}) {
                nodes {
                  bContent
                  createdAt
                  numLikes
                  transaction
                  userId
                  youLiked
                  userByUserId {
                    icon
                    name
                  }
                }
              }
            }
          }
        }`);

    posts = response.allPosts.nodes[0].children.nodes;
    let profiles = document.getElementsByClassName("nes-avatar")
    let userLinks = document.getElementsByClassName("userLink");
    let contents = document.getElementsByClassName("postContent")
    let hearts = document.getElementsByClassName("heart")
    let likes = document.getElementsByClassName("numLikes");
    //let shares = document.getElementsByClassName("share")
    let txids = document.getElementsByClassName("txid");
    let coins = document.getElementsByClassName("coin");
    //let stars = document.getElementsByClassName("nes-icon star is-medium");
    //let boostValues = document.getElementsByClassName("boostValue");
    let times = document.getElementsByClassName("timeago");
    let twetches = document.getElementsByClassName("twetch");
    populateHTML(posts.length);
    const addTwetch = (post, i) => {
        let content = post.bContent.replace('$zeroschool', '');
        //let boostData = data.find(tx => tx.txid === post.transaction);
        //boostValue = boostData !== undefined ? boostData.boosts : 0;
        /*if (profiles[i] !== undefined) {
            fetch('/user', {
                method: 'post',
                body: JSON.stringify({ userId: post.userId }),
                headers: { 'Content-type': 'application/json' }
            })
            .then(res => res.json())
            .then(data => {
                if (data[0].avatar !== '') {
                    profiles[i].src = data[0].avatar;
                }
                else {
                    profiles[i].src = post.userByUserId.icon;
                }
            })
        }*/
        profiles[i].src = post.userByUserId.icon;
        userLinks[i].innerHTML = ` ${post.userByUserId.name} u/${post.userId}`;
        userLinks[i].href = `https://twetch.app/u/${post.userId}`;
        contents[i].innerHTML = applyURLs(content);
        likes[i].innerHTML = post.numLikes;
        likes[i].id = `${post.transaction}_count`;
        twetches[i].id = post.transaction;
        //shares[i].name = post.transaction;
        hearts[i].id = post.transaction;
        if (post.youLiked === "1") {
            hearts[i].className = 'nes-icon heart is-medium';
        }
        else {
            hearts[i].className += ' nes-pointer';
            hearts[i].addEventListener('click', like);
        }
        txids[i].href = `https://search.matterpool.io/tx/${post.transaction}`;
        coins[i].setAttribute("name", post.userId);
        //stars[i].setAttribute("name", post.transaction)
        /*if (boostValue > 0) {
            stars[i].className = 'nes-icon star is-medium'
        };*/
        //boostValues[i].innerHTML = parseInt(boostValue);
        coins[i].addEventListener('click', askTip);
        //stars[i].addEventListener('click', boost);
        //shares[i].addEventListener('click', shareTwetch);
        twetches[i].addEventListener('click', goToTwetch);
        let d = new Date(post.createdAt);
        times[i].innerHTML = timeago(d);
    }
        for (let i = 0; i < posts.length; i++) {
            addTwetch(posts[i], i);
        }
};

function goToTwetch() {
        window.open("https://twetch.app/t/" + this.id);
}

function youtube(content) {
    let youRegex = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
    return content.replace(youRegex, function(url) {let id = url.slice(-11)
    return `<div class="video-container" align="center"><iframe title="YouTube video player" src="https://youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe></div>`})
}
function streamanity(content){
    let strmRegex = /http(s)?:\/\/(.*\.)?streamanity\.com\/video\/([A-z0-9_/?=-]+)/;
    return content.replace(strmRegex, function(url) {let id = url.slice(30);
    return `<div class="video-container" align="center"><iframe title="Streamanity" src="https://streamanity.com/embed/${id}?ref=d14f133c-ae7b-4a87-a277-90fe5bfa32e2" frameborder="0" allowfullscreen></iframe></div>`})
}
function bitcoinfilesEx(content, bfRegex){
    return content.replace(bfRegex, function(url){let txid = url.substr(url.length - 64);
        return `<div><a href="https://media.bitcoinfiles.org/${txid}"><img src="https://media.bitcoinfiles.org/${txid}" class="bitcoinfiles"></a></div>`;
    })
}
function exBFiles(content, show) {
    if (content.indexOf("https://www.bitcoinfiles.org/t") >= 0) {return content.match(/http(s)?:\/\/(.*\.)?bitcoinfiles\.org\/t\/([A-z0-9_\/?=]+)/)[3]}
    else if (content.indexOf("https://media.bitcoinfiles.org/") >= 0){return content.match(/http(s)?:\/\/(.*\.)?media\.bitcoinfiles\.org\/([A-z0-9]+)/)[3]}
    else {if(show){showPopup('No BitcoinFile found.', 'OK');}return ''}
}
function applyURLs(content) {
    if (content.indexOf("https://www.bitcoinfiles.org/t") >= 0) {return bitcoinfilesEx(content, /http(s)?:\/\/(.*\.)?bitcoinfiles\.org\/t\/([A-z0-9_\/?=]+)/)}
    else if (content.indexOf("https://media.bitcoinfiles.org/") >= 0){return bitcoinfilesEx(content, /http(s)?:\/\/(.*\.)?media\.bitcoinfiles\.org\/([A-z0-9]+)/)}
    else if (content.indexOf("youtu") >= 0){return youtube(content)}
    else if (content.indexOf("streamanity.com") >= 0){return streamanity(content)}
    else {var urlRegex = /(https?:\/\/[^\s]+)/g;return content.replace(urlRegex, function(url) {return '<a href="' + url + '"target="_blank">' + url + '</a>'})}
}
