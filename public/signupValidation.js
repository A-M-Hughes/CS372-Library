function validate(form) {
    let password = form.password.value;
    let confirm = form.confirm.value;
    if (password !== confirm) {
        alert("Passwords must match.");
        return false;
    }
    return true;
}