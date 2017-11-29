var BCLS = ( function () {
    var heading = document.getElementsByTagName('h1')[0],
        title = document.getElementsByTagName('title')[0],
        sections = document.getElementsByTagName('h2'),
        links = document.getElementsByTagName('a'),
        sidenav = document.getElementById('sidenav'),
        navList,
        navA,
        navItem,
        navText,
        i,
        iMax,
        item;

    /**
     * tests for all the ways a variable might be undefined or not have a value
     * @param {*} x the variable to test
     * @return {Boolean} true if variable is defined and has a value
     */
    function isDefined (x){
        if ( x === "" || x === null || x === undefined || x === NaN) {
            return false;
        }
        return true;
    }

    function buildSideNav() {
        if (isDefined(sections)) {
            var homeHead = document.createElement('p'),
                homeLink = document.createElement('a');
            homeLink.setAttribute('href', '../../index.html');
            homeLink.setAttribute('style', 'font-size:1.4em;font-weight:bold;text-align:right;margin:0;padding-left:1em');
            homeLink.textContent = 'Docs Index';
            homeHead.appendChild(homeLink);
            navList = document.createElement('ul');
            navList.setAttribute('class', 'sidenav-list');
            navItem = document.createElement('li');
            navA = document.createElement('a');
            navA.setAttribute('href', '#toc0');
            navText = document.createTextNode('Top');
            navA.appendChild(navText);
            navItem.appendChild(navA);
            navList.appendChild(navItem);
            iMax = sections.length;
            for (i = 0; i < iMax; i++) {
                item = sections[i];
                navItem = document.createElement('li');
                navA = document.createElement('a');
                navA.setAttribute('href', '#' + item.id );
                navText = document.createTextNode(item.textContent);
                navA.appendChild(navText);
                navItem.appendChild(navA);
                navList.appendChild(navItem);
            }
            sidenav.appendChild(homeHead);
            sidenav.appendChild(navList);
        }
    }

    /**
     * fix link paths to point to html instead of md
     */
    function fixLinks() {
        var i,
            iMax = links.length,
            link,
            url;
        for (i = 0; i < iMax; i += 1) {
            link = links[i];
            url = link.getAttribute('href');
            if (isDefined(url)) {
                // if CONTRIBUTING.md, don't change
                if (url.indexOf('CONTRIBUTING.md' === -1)) {
                    url.replace('.md', '.html');
                    link.setAttribute('href', url);
                }
            }
        }
    }

    /**
     * set the doc title
     */
    function setTitle() {
        title.textContent = 'Videojs ' + heading.textContent;
    }

    /**
     * add the page footer
     */
    function addFooter() {
        var path = document.location.pathname,
            footer = document.createElement('div'),
            srcLink = document.createElement('a'),
            srcLink2 = document.createElement('a'),
            main = document.getElementById('main'),
            srcPath,
            srcPath2;
        // extract file name
        if (path.indexOf('#') > 0) {
            path = path.substring(0, path.indexOf('#'));
        }
        path = path.substring(path.lastIndexOf('/') + 1);
        srcPath = 'https://github.com/videojs/video.js/blob/master/docs/guides/' + path;
        srcPath2 = 'https://github.com/videojs/docs';
        footer.setAttribute('class', 'footer');
        srcLink.setAttribute('href', srcPath);
        srcLink.appendChild(document.createTextNode('content source'));
        srcLink2.setAttribute('href', srcPath2);
        srcLink2.appendChild(document.createTextNode('doc generator'));
        footer.innerHTML = 'Want to contribute? Go to the ';
        footer.appendChild(srcLink);
        footer.innerHTML += ' or the ';
        footer.appendChild(srcLink2);
        main.appendChild(footer);
    }

    setTitle();
    buildSideNav();
    fixLinks();
    addFooter();
})();
