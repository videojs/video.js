Deploying Version
-----------------
- Update SWF location for CDN

Version Numbers
---------------
http://en.wikipedia.org/wiki/Software_versioning#Sequence-based_identifiers

### Major Version (Integer, e.g 3.0)
- Any features where we expect it could break plugins, skins, or any major API integration.

### Minor Version (3.1)
- Additional non-breaking features

### Revision Versions

- Beta (3.1b1)
- Release Candidate (3.1rc1)
- Release with revisions (3.1r1)

Notes:
The last level of one revision type (beta/release candidate) should match the first level of the next revision type. 4.0-b10 should match 4.0-rc1, assuming b10 is the last beta version.

Release revisions means bug fixes. The CDN url should not reflect the revision number. 4.0-r2 would still be /4.0/.

Tagging a Release
-----------------
`git tag -a [version number] [commit]`

Release Names
-------------
Using [TMNT characters](http://en.wikipedia.org/wiki/List_of_Teenage_Mutant_Ninja_Turtles_characters).

- Alphabetical order
- Major Release - Good Guys
- Minor Release - Bad Guys