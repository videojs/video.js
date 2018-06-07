var title,
    // data structures
    classes = {thisClass: [], parentClass: []},
    // paths
    classFilePath,
    parentClassFilePath,
    // elements
    mainContent,
    main,
    doc_body;

/**
 * tests for all the ways a variable might be undefined or not have a value
 *
 * @param {*} x - the variable to test
 * @return {Boolean} true if variable is defined and has a value
 */
function isDefined(x) {
    if (x === '' || x === null || x === undefined || x === NaN) {
        return false;
    }
    return true;
};
/**
 * determines whether specified item is in an array
 *
 * @param {array} arr - array to check
 * @param {string} item - to check for
 * @return {boolean} true if item is in the array, else false
 */
function isItemInArray(arr, item) {
    var i,
        iMax = arr.length;
    for (i = 0; i < iMax; i++) {
        if (arr[i] === item) {
            return true;
        }
    }
    return false;
};
/**
 * get a copy of (rather than reference to) an object
 *
 * @param  {object} obj - the object you want a copy
 * @return {object} the copy
 */
function copyObj(obj) {
    if (isDefined(obj)) {
        return JSON.parse(JSON.stringify(obj));
    }
    return null;
};
/**
 * find index of an object in array of objects
 * based on some property value
 * generally useful for finding a unique object
 *
 * @param {array} targetArray - array to search
 * @param {string} objProperty - object property to search
 * @param {string|number} value - value of the property to search for
 * @return {integer} index of first instance if found, otherwise returns -1
 */
function findObjectInArray(targetArray, objProperty, value) {
    var i, totalItems = targetArray.length, objFound = false;
    for (i = 0; i < totalItems; i++) {
        if (targetArray[i][objProperty] === value) {
            objFound = true;
            return i;
        }
    }
    if (objFound === false) {
        return -1;
    }
};
/**
 * find indexes of a set of object in array of objects
 * based on some property value
 * generally useful for finding several objects
 *
 * @param {array} targetArray - array to search
 * @param {string} objProperty - object property to search
 * @param {string|number} value - value of the property to search for
 * @return {array} array of indexes for matching objects
 */
function findObjectsInArray(targetArray, objProperty, value) {
    var i, totalItems = targetArray.length, newArr = [];
    for (i = 0; i < totalItems; i++) {
        if (targetArray[i][objProperty] === value) {
            newArr.push(i);
        }
    }
    return newArr;
};
/**
 * get a subset of objects in array of objects
 * based on some property value
 *
 * @param {array} targetArray - array to search
 * @param {string} objProperty - object property to search
 * @param {string|number} value - value of the property to search for
 * @return {array} array of objects with matching property value
 */
function getSubArray(targetArray, objProperty, value) {
    var i, totalItems = targetArray.length, idxArr = [];
    for (i = 0; i < totalItems; i++) {
        if (targetArray[i][objProperty] === value) {
            idxArr.push(targetArray[i]);
        }
    }
    return idxArr;
};
/**
 * sort an array of objects based on an object property
 *
 * @param {array} targetArray - array to sort
 * @param {string} objProperty - property whose value to sort on
 * @return {array} the sorted array
 */
function sortArray(targetArray, objProperty) {
    targetArray.sort(function (a, b) {
        var propA = a[objProperty].toLowerCase(), propB = b[objProperty].toLowerCase();
        // sort ascending; reverse propA and propB to sort descending
        if (propA < propB) {
            return -1;
        } else if (propA > propB) {
            return 1;
        }
        return 0;
    });
    return targetArray;
};
/**
 * create an element
 *
 * @param  {string} type - the element type
 * @param  {object} attributes - attributes to add to the element
 * @return {object} the HTML element
 */
function createEl(type, attributes) {
    var el;
    if (isDefined(type)) {
        el = doc.createElement(type);
        if (isDefined(attributes)) {
            var attr;
            for (attr in attributes) {
                el.setAttribute(attr, attributes[attr]);
            }
        }
        return el;
    }
};
/**
 * creates a text node and adds it to an element
 * @param {object|node} el - the node (element) to add the text to
 * @param {string} str - the text to add
 */
function addText(el, str) {
    var text = doc.createTextNode(str);
    el.appendChild(text);
};
/**
 * finds the objects in the doc data for a fileName
 *
 * @param {array} arr - the array of objects to search
 * @param {string} filename - the filename to look for in the meta object
 * @return {array} - array of the objects found
 */
function findClassObjects(arr, filename) {
    var i, totalItems = arr.length, newArr = [];
    for (i = 0; i < totalItems; i++) {
        if (isDefined(arr[i].meta)) {
            if (arr[i].meta.filename === filename) {
                newArr.push(arr[i]);
            }
        }

    }
    return newArr;

};
/**
 * add the class header content
 */
function addHeaderContent() {
    var topSection = createEl('section', {id: 'top', class: 'section'}),
        headerData = doc_data.thisClass.headerInfo,
        header = createEl('h1'),
        extendsNode = createEl('p'),
        extendsLink,
        definedIn = createEl('p'),
        definedInLink = createEl('a', {href: docsPath + classFilePath + '#L' + headerData.meta.lineno}),
        description = createEl('div', {style: 'border:none', id: 'classDescription'}),
        descriptionEl,
        constructorHeader = createEl('h3'),
        constructorPre = createEl('pre'),
        constructorCode = createEl('code'),
        constructorParamsHeader = createEl('h4'),
        constructorParams = [],
        text;
    // add main content wrapper
    doc_body.appendChild(mainContent);
    main = doc.getElementById('main');
    // add elements
    topSection.appendChild(header);
    topSection.appendChild(description);
    // source file
    topSection.appendChild(definedIn);
    addText(definedIn, 'DEFINED IN: ');
    definedIn.appendChild(definedInLink);
    addText(definedInLink, headerData.meta.filename + ' line number: ' + headerData.meta.lineno);
    mainContent.appendChild(topSection);
    // page header
    addText(header, headerData.name);
    // parent info if this class extends another
    if (isDefined(doc_data.parentClasses)) {
        topSection.appendChild(extendsNode);
        addText(extendsNode, 'EXTENDS: ');
        extendsLink = createEl('a', {href: parentClassFilePath + doc_data.parentClasses[0].headerInfo.meta.filename});
        extendsNode.appendChild(extendsLink);
        addText(extendsLink, doc_data.parentClasses[0].headerInfo.meta.filename);
    }
    // constructor info - don't add for video.js
    if (doc_data.thisClass.headerInfo.name !== 'videojs') {
        topSection.appendChild(constructorHeader);
        topSection.appendChild(constructorPre);
        constructorPre.appendChild(constructorCode);
        // create the constructor info
        addText(constructorHeader, 'Constructor');

        // get constructor params if any
        if (isDefined(headerData.params)) {
            var paramTableHeaders = ['name', 'Type', 'Required', 'Description'],
                paramTable = createEl('table'),
                paramThead = createEl('thead'),
                paramTbody = createEl('tbody'),
                paramTheadRow = createEl('tr'),
                paramTbodyRow = createEl('tr'),
                paramTH,
                paramTD,
                k,
                kMax;

            addText(constructorParamsHeader, 'Parameters');
            paramTable.appendChild(paramThead);
            paramTable.appendChild(paramTbody);
            paramThead.appendChild(paramTheadRow);
            // set the table headers
            kMax = paramTableHeaders.length;
            for (k = 0; k < kMax; k++) {
                paramTH = createEl('th');
                paramTheadRow.appendChild(paramTH);
                addText(paramTH, paramTableHeaders[k]);
            }
            // now the table info
            kMax = headerData.params.length;
            for (k = 0; k < kMax; k++) {
                paramTbodyRow = createEl('tr');
                paramTbody.appendChild(paramTbodyRow);
                paramTD = createEl('td');
                addText(paramTD, headerData.params[k].name);
                paramTbodyRow.appendChild(paramTD);
                paramTD = createEl('td');
                addText(paramTD, headerData.params[k].type.names.join('|'));
                paramTbodyRow.appendChild(paramTD);
                paramTD = createEl('td');
                if (headerData.params[k].optional) {
                    text = doc.createTextNode('no');
                    constructorParams.push('[' + headerData.params[k].name + ']');
                } else {
                    text = doc.createTextNode('yes');
                    constructorParams.push(headerData.params[k].name);
                }
                paramTD.appendChild(text);
                if (isDefined(headerData.params[k].description)) {
                    paramTbodyRow.appendChild(paramTD);
                    paramTD = createEl('td');
                    addText(paramTD, headerData.params[k].description.slice(3, headerData.params[k].description.indexOf('</p>')));
                    paramTbodyRow.appendChild(paramTD);
                }
                paramTbody.appendChild(paramTbodyRow);
            }
            topSection.appendChild(constructorParamsHeader);
            topSection.appendChild(paramTable);
        }
    }
    // add constructor params to signature if any
    if (constructorParams.length > 0) {
        text = doc.createTextNode(headerData.name + '( ' + constructorParams.join(',') + ' )');
    } else {
        text = doc.createTextNode(headerData.name + '()');
    }
    constructorCode.appendChild(text);
    descriptionEl = doc.getElementById('classDescription');
    descriptionEl.innerHTML = headerData.description;
};
/**
 * add the side nav
 */
function addIndex() {
    var section = createEl('section', {id: 'index', class: 'side-nav'}),
        navHeader = createEl('h2', {class: 'sideNavHeader'}),
        navHeaderLink = createEl('a', {href: 'index.html'}),
        memberIndex = createEl('div', {id: 'memberIndex', class: 'member-index'}),
        thisMember,
        addedMembers = {},
        item,
        thisParent,
        parentList,
        header,
        listItem,
        listLink,
        classHeader,
        parentHeader,
        i,
        iMax,
        j,
        jMax,
        // helper functions
        classHasMembers = function (member) {
            if (doc_data.thisClass[member].length > 0) {
                return true;
            }
            return false;
        },
        parentsHaveMembers = function () {
            if (doc_data.parentClasses.length > 0) {
                for (i = 0; i < doc_data.parentClasses.length; i++) {
                    if (doc_data.parentClasses[i][thisMember].length > 0) {
                        return true;
                    }
                }
                return false;
            }
        },
        makeList = function (classArr, parentArr, member, list) {
            thisMember = member.toLowerCase();
            if (classArr.length > 0 || (isDefined(doc_data.parentClass) && parentArr.length > 0)) {
                // add member list header
                if (classHasMembers(thisMember) || parentsHaveMembers(thisMember)) {
                    header = createEl('h3');
                    addText(header, doc_data.thisClass.headerInfo.name + ' ' + member);
                } else {
                    return;
                }
                if (classHasMembers(thisMember)) {
                    classHeader = createEl('h4');
                    addText(classHeader, 'Class ' + member);
                    memberIndex.appendChild(header);
                    memberIndex.appendChild(classHeader);
                    // add the list & items
                    list = createEl('ul', {id: list});
                    memberIndex.appendChild(list);
                    iMax = classArr.length;
                    for (i = 0; i < iMax; i++) {
                        item = classArr[i].name;
                        if (!isItemInArray(addedMembers[member], item)) {
                            // keep track of added members to remove overridden ones
                            addedMembers[member].push(item);
                            listItem = createEl('li');
                            listLink = createEl('a', {href: '#' + member + item});
                            addText(listLink, item);
                            listItem.appendChild(listLink);
                            list.appendChild(listItem);
                        }
                    }
                }

                // add inherited items if any
                if (isDefined(parentArr) && parentArr.length > 0) {
                    jMax = parentArr.length;
                    for (j = 0; j < jMax; j++) {
                        thisParent = parentArr[j];
                        if (thisParent[thisMember].length > 0) {
                            parentHeader = createEl('h4');
                            addText(parentHeader, 'Inherited ' + member + ' from ' + thisParent.headerInfo.name);
                            memberIndex.appendChild(parentHeader);
                            parentList = createEl('ul');
                            memberIndex.appendChild(parentList);
                            iMax = thisParent[thisMember].length;
                            for (i = 0; i < iMax; i++) {
                                item = thisParent[thisMember][i].name;
                                if (!isItemInArray(addedMembers[member], item)) {
                                    addedMembers[member].push(item);
                                    listItem = createEl('li');
                                    listLink = createEl('a', {href: '#' + member + item});
                                    listItem.appendChild(listLink);
                                    addText(listLink, item);
                                    parentList.appendChild(listItem);
                                }

                            }
                        }

                    }

                }
            }
        };
    // data structure to track members already added
    addedMembers.Methods = [];
    addedMembers.Properties = [];
    addedMembers.Events = [];

    navHeader.appendChild(navHeaderLink);
    addText(navHeaderLink, 'API Index');
    // add parent class members if any
    if (isDefined(doc_data.parentClasses)) {
        makeList(doc_data.thisClass.properties, doc_data.parentClasses, 'Properties', 'propertiesList');
        makeList(doc_data.thisClass.methods, doc_data.parentClasses, 'Methods', 'methodsList');
        makeList(doc_data.thisClass.events, doc_data.parentClasses, 'Events', 'eventsList');
    } else {
        makeList(doc_data.thisClass.properties, [], 'Properties', 'propertiesList');
        makeList(doc_data.thisClass.methods, [], 'Methods', 'methodsList');
        makeList(doc_data.thisClass.events, [], 'Events', 'eventsList');
    }
    section.appendChild(navHeader);
    section.appendChild(memberIndex);
    doc_body.appendChild(section);

};
/**
 * add the member content
 */
function addMembersContent() {
    var members = [{name: 'Properties', data: 'properties'}, {name: 'Methods', data: 'methods'}, {name: 'Events', data: 'events'}],
        member,
        addedMembers = {},
        section,
        header,
        headerSuffix,
        item,
        itemWrapper,
        itemHeader,
        itemHeaderStr,
        itemParams = [],
        itemParamsHeader,
        itemDescription,
        itemDescriptionEl,
        itemFooter,
        itemFooterLink,
        itemFooterContent,
        paramTable,
        paramThead,
        paramTbody,
        paramTheadRow,
        paramTbodyRow,
        paramTH,
        paramTD,
        paramTableHeaders = ['name', 'Type', 'Required', 'Description'],
        text,
        i,
        iMax,
        j,
        jMax,
        k,
        kMax,
        m,
        mMax,
        topLinkP,
        topLinkA,
        // helper function
        createMemberItem = function (classData, member) {
            // create the class member items
            jMax = classData[member.data].length;
            for (j = 0; j < jMax; j++) {
                item = classData[member.data][j];
                if (!isItemInArray(addedMembers[member.name], item.name)) {
                    addedMembers[member.name].push(item.name);
                    itemWrapper = createEl('div', {id: member.name + item.name});
                    section.appendChild(itemWrapper);
                    itemHeader = createEl('h3', {id: item.name + 'Header'});
                    itemHeaderStr = item.name;
                    itemWrapper.appendChild(itemHeader);
                    itemDescription = createEl('div', {id: item.name + 'Description', class: 'description'});
                    itemWrapper.appendChild(itemDescription);
                    itemFooter = createEl('p', {class: 'vjs-only'});
                    itemFooterLink = createEl('a', {href: docsPath + item.meta.filename + '#L' + item.meta.lineno});
                    itemFooterContent = createEl('em', {id: item.name + 'Footer'});
                    itemFooter.appendChild(itemFooterContent);
                    topLinkP = createEl('p');
                    topLinkA = createEl('a', {href: '#top'});
                    addText(topLinkA, '[back to top]');
                    topLinkP.appendChild(topLinkA);
                    // for methods only handle params if any
                    if (member.name === 'Methods' && isDefined(item.params)) {
                        itemParams = [];
                        itemParamsHeader = createEl('h4');
                        addText(itemParamsHeader, 'Parameters');
                        paramTable = createEl('table');
                        paramThead = createEl('thead');
                        paramTbody = createEl('tbody');
                        paramTable.appendChild(paramThead);
                        paramTable.appendChild(paramTbody);
                        paramTheadRow = createEl('tr');
                        paramThead.appendChild(paramTheadRow);
                        // set the table headers
                        kMax = paramTableHeaders.length;
                        for (k = 0; k < kMax; k++) {
                            paramTH = createEl('th');
                            paramTheadRow.appendChild(paramTH);
                            addText(paramTH, paramTableHeaders[k]);
                        }
                        // now the table info
                        kMax = item.params.length;
                        for (k = 0; k < kMax; k++) {
                            paramTbodyRow = createEl('tr');
                            paramTbody.appendChild(paramTbodyRow);
                            paramTD = createEl('td');
                            addText(paramTD, item.params[k].name);
                            paramTbodyRow.appendChild(paramTD);
                            paramTD = createEl('td');
                            addText(paramTD, item.params[k].type.names.join('|'));
                            paramTbodyRow.appendChild(paramTD);
                            paramTD = createEl('td');
                            if (item.params[k].optional) {
                                text = doc.createTextNode('no');
                                itemParams.push('[' + item.params[k].name + ']');
                            } else {
                                text = doc.createTextNode('yes');
                                itemParams.push(item.params[k].name);
                            }
                            paramTD.appendChild(text);
                            if (isDefined(item.params[k].description)) {
                                paramTbodyRow.appendChild(paramTD);
                                paramTD = createEl('td');
                                addText(paramTD, item.params[k].description.slice(3, item.params[k].description.indexOf('</p>')));
                                paramTbodyRow.appendChild(paramTD);
                            }
                            paramTbody.appendChild(paramTbodyRow);
                        }
                        itemHeaderStr += '( ' + itemParams.join(', ') + ' )';
                        if (item.scope === 'static') {
                            itemHeaderStr = 'static ' + itemHeaderStr;
                        }
                        itemWrapper.appendChild(itemParamsHeader);
                        itemWrapper.appendChild(paramTable);
                    } else if (member.name === 'Methods') {
                        itemHeaderStr += '()';
                    }
                    itemWrapper.appendChild(itemFooter);
                    itemWrapper.appendChild(topLinkP);
                    addText(itemHeader, itemHeaderStr);
                    if (isDefined(item.deprecated)) {
                        headerSuffix = createEl('em', {class: 'deprecated'});
                        text = doc.createTextNode();
                        addText(headerSuffix, ' (deprecated)');
                        itemHeader.appendChild(headerSuffix);
                    }
                    itemDescriptionEl = doc.getElementById(item.name + 'Description');
                    itemDescriptionEl.innerHTML = item.description;
                    addText(itemFooterContent, 'Defined in ');
                    itemFooterContent.appendChild(itemFooterLink);
                    addText(itemFooterLink, 'src/js/' + item.meta.filename + ' line number: ' + item.meta.lineno);
                }
            }
        };
    // data structure to track members already added
    addedMembers.Methods = [];
    addedMembers.Properties = [];
    addedMembers.Events = [];
    iMax = members.length;
    for (i = 0; i < iMax; i++) {
        member = members[i];
        if (doc_data.thisClass[member.data].length > 0) {
            // create the member section
            section = createEl('section', {id: member.name.toLowerCase(), class: 'section'});
            main.appendChild(section);
            header = createEl('h2');
            addText(header, member.name);
            section.appendChild(header);
            // create the member items
            createMemberItem(doc_data.thisClass, member);
            if (isDefined(doc_data.parentClasses)) {
                mMax = doc_data.parentClasses.length;
                for (m = 0; m < mMax; m++) {
                    if (doc_data.parentClasses[m][member.data].length > 0) {
                        createMemberItem(doc_data.parentClasses[m], member);
                    }
                }
            }
        }
    }
};

/**
 * gets things going
 * @param {string} docFileName - name of the HTML doc we're building
 */
function contentInit(docFileName) {
    var fileName,
        parent_class_name,
        privateItems = [],
        srcFileName,
        idx,
        text,
        j,
        parentCounter = 0,
        // helper function to get the chain of parent classes
        getAncestorData = function (parent_class) {
            // get data objects for the class
            classes.parentClasses[parentCounter] = findClassObjects(docData, parent_class + '.js');
            // check to see if there are any parent class items
            if (classes.parentClasses[parentCounter].length > 0) {
                doc_data.parentClasses[parentCounter] = {};
                // get parent header info
                idx = findObjectInArray(classes.parentClasses[parentCounter], 'kind', 'class');
                doc_data.parentClasses[parentCounter].headerInfo = copyObj(classes.parentClasses[parentCounter][idx]);
                // get parent class path
                idx = findObjectInArray(classes.parentClasses[parentCounter], 'kind', 'file');
                if (idx > -1) {
                    parentClassFilePath = classes.parentClasses[parentCounter][idx].name;
                } else {
                    parentClassFilePath = doc_data.parentClasses[parentCounter].headerInfo.meta.filename;
                }
                // remove any private items
                privateItems = findObjectsInArray(classes.parentClasses[parentCounter], 'access', 'private');
                j = privateItems.length;
                while (j > 0) {
                    j--;
                    classes.parentClasses[parentCounter].splice(privateItems[j], 1);
                }
                // now get the member arrays
                doc_data.parentClasses[parentCounter].methods = getSubArray(classes.parentClasses[parentCounter], 'kind', 'function');
                doc_data.parentClasses[parentCounter].methods = sortArray(doc_data.parentClasses[parentCounter].methods, 'name');
                doc_data.parentClasses[parentCounter].events = getSubArray(classes.parentClasses[parentCounter], 'kind', 'event');
                doc_data.parentClasses[parentCounter].events = sortArray(doc_data.parentClasses[parentCounter].events, 'name');
                doc_data.parentClasses[parentCounter].properties = getSubArray(classes.parentClasses[parentCounter], 'kind', 'property');
                doc_data.parentClasses[parentCounter].properties = sortArray(doc_data.parentClasses[parentCounter].properties, 'name');
            }
            // get parent class, if any, and anything it inherits
            if (isDefined(doc_data.parentClasses[parentCounter].headerInfo.augments)) {
                idx = findObjectInArray(docData, 'name', doc_data.parentClasses[parentCounter].headerInfo.augments[0]);
                parent_class_name = docData[idx].meta.filename.replace('.js', '');
                parentCounter++;
                getAncestorData(parent_class_name);
            }
        };
    // get refenence to doc body and title
    doc_body = doc.getElementsByTagName('body')[0];
    title = doc.getElementsByTagName('title')[0];
    // content wrapper
    mainContent = createEl('div', {id: 'main', class: 'section'});
    // src file is the js file of the same name
    srcFileName = docFileName.replace('.html', '.js')
    // video.js is a special case - all others will be the same
    if (srcFileName === 'video.js') {
        // for doc purposes, treat video like a class, though it's not
        // get the data objects for this class
        classes.thisClass = findClassObjects(docData, srcFileName);
        idx = findObjectInArray(classes.thisClass, 'name', 'videojs');
        doc_data.thisClass = {};
        // get the class overview object
        doc_data.thisClass.headerInfo = copyObj(classes.thisClass[idx]);
        doc_data.thisClass.headerInfo.name = 'videojs';
        idx = findObjectInArray(classes.thisClass, 'kind', 'file');
        if (idx > -1) {
            classFilePath = classes.thisClass[idx].name;
        } else {
            classFilePath = doc_data.thisClass.headerInfo.meta.filename;
        }
        // set the doc title
        text = doc.createTextNode(doc_data.thisClass.headerInfo.name);
        title.appendChild(text);
        // remove any private items
        privateItems = findObjectsInArray(classes.thisClass, 'access', 'private');
        j = privateItems.length;
        while (j > 0) {
            j--;
            classes.thisClass.splice(privateItems[j], 1);
        }
        // now get the member arrays
        doc_data.thisClass.methods = getSubArray(classes.thisClass, 'kind', 'function');
        doc_data.thisClass.methods = sortArray(doc_data.thisClass.methods, 'name');
        doc_data.thisClass.events = getSubArray(classes.thisClass, 'kind', 'event');
        doc_data.thisClass.events = sortArray(doc_data.thisClass.events, 'name');
        doc_data.thisClass.properties = getSubArray(classes.thisClass, 'kind', 'property');
        doc_data.thisClass.properties = sortArray(doc_data.thisClass.properties, 'name');
    } else {
        // get the data objects for this class
        classes.thisClass = findClassObjects(docData, srcFileName);
        idx = findObjectInArray(classes.thisClass, 'kind', 'class');
        doc_data.thisClass = {};
        doc_data.thisClass.headerInfo = copyObj(classes.thisClass[idx]);
        // get the file path from @file object
        idx = findObjectInArray(classes.thisClass, 'kind', 'file');
        if (idx > -1) {
            classFilePath = classes.thisClass[idx].name;
        } else {
            classFilePath = doc_data.thisClass.headerInfo.meta.filename;
        }
        // set the doc title
        text = doc.createTextNode(doc_data.thisClass.headerInfo.name);
        title.appendChild(text);
        // remove any private items
        privateItems = findObjectsInArray(classes.thisClass, 'access', 'private');
        j = privateItems.length;
        while (j > 0) {
            j--;
            classes.thisClass.splice(privateItems[j], 1);
        }
        // now get the member arrays
        doc_data.thisClass.methods = getSubArray(classes.thisClass, 'kind', 'function');
        doc_data.thisClass.methods = sortArray(doc_data.thisClass.methods, 'name');
        doc_data.thisClass.events = getSubArray(classes.thisClass, 'kind', 'event');
        doc_data.thisClass.events = sortArray(doc_data.thisClass.events, 'name');
        doc_data.thisClass.properties = getSubArray(classes.thisClass, 'kind', 'property');
        doc_data.thisClass.properties = sortArray(doc_data.thisClass.properties, 'name');
        // get parent class, if any, and anything it inherits
        if (isDefined(doc_data.thisClass.headerInfo.augments)) {
            doc_data.parentClass = {};
            doc_data.parentClasses = [];
            classes.parentClasses = [];
            idx = findObjectInArray(docData, 'name', doc_data.thisClass.headerInfo.augments[0]);
            parent_class_name = docData[idx].meta.filename.replace('.js', '');
            getAncestorData(parent_class_name);
        }
    }
    // now we're ready to roll
    addIndex();
    addHeaderContent();
    addMembersContent();
};
