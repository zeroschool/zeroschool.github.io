const relayXLogin = async() => {
            if (!localStorage.getItem('tokenTwetchAuth')) {
                let token = await relayone.authBeta({withGrant:true}), res;
                localStorage.setItem('token', token);
                let [payload, signature] = token.split(".");
                const data = JSON.parse(atob(payload));
                fetch('https://auth.twetch.app/api/v1/challenge', {method: 'get'})
                .then(function (res){return res.json()})
                .then(async(resp) => {
                    try {
                        res = await relayone.sign(resp.message);
                        let signAddr = await getAddress(data.pubkey);
                        if (res) {
                            saveWallet(data.paymail, 'relayx');
                            if (localStorage.getItem('paymail')) {
                                twLogin(signAddr, resp.message, res.value, () => {
                                    window.location.href = window.location.origin;
                                });
                            }
                        }
                    }
                    catch(e){
                        alert(e);
                    }
                });
            }
            else {
                window.location.href = window.location.origin;
            }
        }
