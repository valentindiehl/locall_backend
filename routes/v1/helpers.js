module.exports = {
    newError: function(code, message) {

    }
};

function returnError(code, message) {
        return {
            code: code,
            message: message
        }
}