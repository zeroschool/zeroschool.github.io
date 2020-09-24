const saveWallet = (paymail, wallet) => {
    localStorage.setItem('paymail', paymail);
    localStorage.setItem('wallet', wallet);
}
const imbLogin = async() => {
    if (!localStorage.getItem('tokenTwetchAuth')) {
        fetch('https://auth.twetch.app/api/v1/challenge')
        .then(function (res){return res.json()})
        .then(async(resp) => {
            var cryptoOperations = [
                {name:'mySignature', method:'sign', data: resp.message, dataEncoding:'utf8', key:'identity', algorithm:'bitcoin-signed-message'},
                {name:'myPublicKey', method:'public-key', key:'identity'},
                {name: 'myAddress', method: 'address', key: 'identity'}
            ];
            imb.swipe({
                cryptoOperations: cryptoOperations,
                onCryptoOperations: async(ops) => {
                    saveWallet(ops[1].paymail, 'moneybutton');
                    if (localStorage.getItem('paymail')) {
                        twLogin(ops[2].value, resp.message, ops[0].value, () => {
                            window.location.href = window.location.origin;
                        });
                    }
                }
            });
        });
    }
    else {
        window.location.href = window.location.origin;
    }
}
const twLogin = (address, message, signature, callback) => {
    if (localStorage.getItem('token')) {
        if (!localStorage.getItem('tokenTwetchAuth')) {
            let obj = { address, message, signature };
            fetch('https://auth.twetch.app/api/v1/authenticate', {
                method: 'post',
                body: JSON.stringify(obj),
                headers: { 'Content-type': 'application/json' }
            })
            .then((res) => {return res.json()})
            .then((resp) => {
                localStorage.setItem('tokenTwetchAuth', resp.token);
                callback();
            });
        }
        else {
            window.localStorage.href = '/';
        }
    } else {
        window.location.href = "/login";
    }
}
const dimeAuth = async() => {
    let isLinked = await relayone.isLinked();
    if (isLinked) {
        dimely.auth(async (challenge) => {
            const token = await relayone.authBeta()
            const [payload] = token.split('.')
            const { paymail } = JSON.parse(atob(payload))
            const signature = (await relayone.sign(challenge)).value
            return { paymail, signature }
        })
    }
}
