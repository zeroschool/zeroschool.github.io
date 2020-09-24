const savePermissionToken = (token) => {
    localStorage.setItem('token', token);
}
const getPermissionForCurrentUser = () => {
    if (localStorage.getItem('token')) {
        return localStorage.getItem('token');
    }
}
const imbCli = window.location.href.includes('localhost') ? '1913d9e4da4bad3e2e3da03e19df0705' : 'ce4eb6ea41a4f43044dd7e71c08e50b2';
const imb = new moneyButton.IMB({
    clientIdentifier: imbCli,
    permission: getPermissionForCurrentUser(), 
    onNewPermissionGranted: (token) => savePermissionToken(token)
});
