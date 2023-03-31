# Video.js Governance

This document sets up the guidelines for ongoing governance and maintenance of Video.js.

## Brightcove’s Position

Brightcove holds the Video.js trademark and has been the maintainer and corporate steward of the project for over a decade. Video.js is the core of the Brightcove Player and, as such, its maintenance is commercially critical to the company.

However, Brightcove acknowledges that the scope of Video.js is broader than its commercial interests. Many companies and developers around the globe use Video.js, so the company recognizes the value of a governance model that embraces collaboration with the wider community.

Brightcove welcomes the expertise and passion of individuals from outside the company who donate their time to help make Video.js the best open source web media player available.

## Shared Responsibility and the Technical Steering Committee

The Video.js project is jointly governed by Brightcove and a Technical Steering Committee (TSC). Responsibilities are divided in the following way:

* Brightcove’s responsibility is to provide logistical and administrative control of the project as well as staffing the day-to-day maintenance of Video.js. Brightcove collaborates with the TSC as a member in the Corporate Shepherd role.
* The TSC’s responsibility is to discuss, debate, and define the overall technical direction of the project by consensus. In large part, this means representing the perspective of users who are external to Brightcove.

Initial membership invitations to the TSC were given to founders of the project and individuals who had been long-term active contributors to Video.js and who had significant experience with the management of the project.

Membership is expected to evolve over time according to the needs of the project and the contributions of individuals.

### Current TSC Members

* [Ben Clifford](https://github.com/mister-ben) (Brightcove)
* [Pat O’Neill](https://github.com/misteroneill) (Brightcove)
* [Garrett Singer](https://github.com/gesinger) (LinkedIn)
* [Steve Heffernan](https://github.com/heff) (Mux)
* [Matthew McClure](https://github.com/mmcc) (Mux)
* [Gary Katsevman](https://github.com/gkatsev) (Mux)

### Corporate Shepherd of the TSC

In recognition of its long-term commitment to Video.js, Brightcove holds the special distinction of Corporate Shepherd for Video.js, which involves:

* Brightcove occupies a minimum of one permanent seat on the TSC, reserved for an employee who actively contributes to the project.
* Brightcove is prominently acknowledged as Corporate Shepherd on the Video.js website.
* Should the TSC be unable to reach consensus on a topic, Brightcove will settle the question at hand.

## Collaborators

The GitHub repositories in the Video.js organization are maintained by Brightcove and the TSC. Additional Collaborators are added and removed by Brightcove and the TSC on an ongoing basis. All TSC members are considered Collaborators implicitly.

All Collaborators have the following permissions:

* Approve pull requests
* Merge pull requests
* Push new tags/releases

Collaborators meet monthly on an optional video call.

### Types of Collaborator

There are two types of Collaborator. A guide for Collaborators of both types is maintained in the Video.js [COLLABORATOR_GUIDE.md](https://github.com/videojs/video.js/blob/main/COLLABORATOR_GUIDE.md). They are distinguished as follows:

#### Community Collaborators

Community Collaborators are individuals from the community who make multiple significant and valuable contributions to Video.js.

These are nominated by existing Collaborators and their nominations are discussed during the monthly TSC meeting.

Community Collaborators who are inactive in the project for a period of 6 months or more are considered to have resigned their status and their access will be revoked.

#### Core Collaborators

Core Collaborators are employees of Brightcove.

Because these individuals’ employment involves Video.js contribution, this status is automatic and persists throughout the duration of their employment.

Core Collaborators who leave Brightcove become Community Collaborators.

### Current Collaborators

* Sindhu Barathan (Core)
* Alex Barstow (Core)
* Brandon Casey
* Dzianis Dashkevich (Core)
* Lahiru Dayananda
* Owen Edwards
* Phil Hale (Core)
* Carey Hinoki
* David LaPalomento
* Usman Omar (Core)
* Roman Pougatchev (Core)
* Sarah Rimron-Soutter (Core)
* Jon-Carlos Rivera
* Walter Seymour (Core)
* Harisha Swaminathan (Core)
* Adam Waldron (Core)

## Contributors

Anyone who makes (or wishes to make) a contribution of any significance through a code patch is considered a Contributor.

The full list of Contributors is provided by GitHub in each repository.

A guide for Contributors is maintained in the Video.js [CONTRIBUTING.md](https://github.com/videojs/video.js/blob/main/CONTRIBUTING.md).

## TSC Membership

Collaborators who, over multiple years, show a long-term dedication to maintaining and improving Video.js may be considered for TSC membership should the TSC see a need for their expertise or for balance in its membership.

The TSC may add members by a standard TSC motion. A TSC member may be removed from the TSC by voluntary resignation or by a standard TSC motion. A TSC member who does not participate in TSC proceedings (without due cause) for a period of one year will be considered to have resigned.

Changes to TSC membership should be posted in the agenda, and may be suggested as any other agenda item (see "TSC Meetings" below).

No more than half of the TSC members may be employed by the same company - including Brightcove. If a situation arises where more than half of the TSC membership shares an employer, then the situation must be remedied by the resignation or removal of one or more TSC members affiliated with the over-represented employer - or the addition of new TSC members from other employers.

## TSC Meetings

The TSC meets monthly on a video call.

Items are added to the TSC agenda which are considered contentious or are modifications of governance, contribution policy, TSC membership, or release process.

The intention of the agenda is not to approve or review pull requests. That should happen continuously on GitHub and be handled by the larger group of Collaborators.

Any community member or contributor can ask that something be added to the next meeting's agenda by logging a GitHub Issue. Any Collaborator or TSC member can add the item to the agenda by adding the _tsc-agenda_ tag to the issue.

TSC members can add any items they like to the agenda at the beginning of each meeting. The TSC cannot veto or remove items from the agenda before time is granted for discussion.

The TSC may invite representatives from outside the project to participate in a non-voting capacity.

## Consensus Seeking Process

The TSC follows a Consensus Seeking decision making model.

When an agenda item has appeared to reach a consensus, a TSC member can call for a final vote.

If an agenda item cannot reach a consensus, a TSC member can call for either a closing vote or a vote to table the issue to the next meeting. The call for a vote must be approved by a majority of the TSC or else the discussion will continue.

In all voting processes, a simple majority (half plus one) wins.
