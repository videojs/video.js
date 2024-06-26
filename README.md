### Your own coverage tool
Hieu Nguyen Viet

Function 1: handleKeydown() in menu-button.js

The code before the instrumentation:

![keyDownBefore](hieuimgs/keyDownBefore.png)

The code after the instrumentation:

![keyDownAfter](hieuimgs/keyDownAfter.png)

Coverage results:

![logKeyDown](hieuimgs/logKeyDown.PNG)
![coverageResKeyDown](hieuimgs/coverageResKeyDownBe4.png)

Function 2: handleSubmenuKeyDown() in menu-button.js

The code before the instrumentation:

![subMenuBefore](hieuimgs/subMenuBefore.png)

The code after the instrumentation:

![subMenuAfter](hieuimgs/subMenuAfter.png)

Coverage results:

![logSubMenu](hieuimgs/logSubMenu.png)

![coverageSubMenu](hieuimgs/coverageSubMenu.png)

## Coverage improvement

### Individual tests

Hieu Nguyen Viet

<Test 1>

<Show a patch (diff) or a link to a commit made in your forked repository that shows the new/enhanced test>
[test/unit/menu.test.js](https://github.com/cukibe123/SEP-Group-46/commit/e9ab648893a67a62dcc9073888fb5aa9e687051d)
<Provide a screenshot of the old coverage results (the same as you already showed above)>
![coverageResKeyDown](hieuimgs/coverageResKeyDownBe4.png)
<Provide a screenshot of the new coverage results>
![coverageResKeyDown](hieuimgs/coverageKeyDownAfter.PNG)
<State the coverage improvement with a number and elaborate on why the coverage is improved>

The previous version of the test file did not cover the situation where the ESC or Tab was pressed. What we did was simply add tests in. The function coverage was 0% and we got it up to 85%.

<Test 2>

<Provide the same kind of information provided for Test 1>
<Show a patch (diff) or a link to a commit made in your forked repository that shows the new/enhanced test>
[test/unit/menu.test.js](https://github.com/cukibe123/SEP-Group-46/commit/e9ab648893a67a62dcc9073888fb5aa9e687051d)
![coverageSubMenu](hieuimgs/coverageSubMenu.png)

![coverageSubMenu](hieuimgs/coverageSubMenuAfter.PNG)
****
