BCLSHighlighter = (function(hljs) {
    var codeBlocks = document.querySelectorAll('pre>code'),
        i,
        iMax,
        txt,
        reLT = new RegExp('<', 'g'),
        reGT = new RegExp('>;', 'g');

    /**
     * tests for all the ways a variable might be undefined or not have a value
     * @param {*} x the variable to test
     * @return {Boolean} true if variable is defined and has a value
     */
    function isDefined(x) {
        if (x === '' || x === null || x === undefined || x === NaN) {
            return false;
        }
        return true;
    };

    if (isDefined(codeBlocks)) {
        iMax = codeBlocks.length;
        for (i = 0; i < iMax; i++) {
            txt = codeBlocks[i].innerHTML.toString();
            txt = txt.replace(reLT, '&lt;');
            txt = txt.replace(reGT, '&gt;');
            codeBlocks[i].innerHTML = txt;
            hljs.highlightBlock(codeBlocks[i]);
        }
    }
})(hljs);