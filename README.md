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

[test/unit/menu.test.js](https://github.com/cukibe123/SEP-Group-46/commit/e9ab648893a67a62dcc9073888fb5aa9e687051d)
Old Coverage Results:

![coverageResKeyDown](hieuimgs/coverageResKeyDownBe4.png)

New Coverage Results:

![coverageResKeyDown](hieuimgs/coverageKeyDownAfter.PNG)

The previous version of the test file did not cover the situation where the ESC or Tab was pressed. What we did was simply add tests in. The function coverage was 0% and we got it up to 85%.

<Test 2>

[test/unit/menu.test.js](https://github.com/cukibe123/SEP-Group-46/commit/e9ab648893a67a62dcc9073888fb5aa9e687051d)

Old Coverage Results:

![coverageSubMenu](hieuimgs/coverageSubMenu.png)

New Coverage Results:

![coverageSubMenu](hieuimgs/coverageSubMenuAfter.PNG)

This coverage was basically the same and two tests was included to cover the cases where ESC or Tab is pressed. The coverage went from 0% to 90%.
****

## Statement of individual contributions

<Write what each group member did>
I looked through the functions and found 2 similar ones to deal with. It was obvious what the problem was when the cases of pressing ESC and TAB was not covered. I took the previous tests that the owners made as examples and went along with it. I wrote down all the branches that was included in the code and created tests for each of those branch.
