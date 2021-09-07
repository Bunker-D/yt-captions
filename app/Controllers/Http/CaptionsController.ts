import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { ResponseContract } from '@ioc:Adonis/Core/Response';
import { default as youtubedl, YtResponse } from 'youtube-dl-exec';
import { default as fetch } from 'node-fetch';

export default class CaptionsController {

	//TODO  TEST
	public async test( { view }: HttpContextContract ): Promise<string> {
		const text = "00:00~ I|00:00~ have|00:00~ suspicions|00:01~ that|00:01~ some|00:02~ of|00:02~ the|00:02~ claims|00:02~ I|00:02~ make|00:03~ in|00:03~ always|00:03~ a|00:03~ bigger|00:03~ fish|00:04~ that|00:04~ conservatism|00:05~ isn't|00:06~ at|00:06~ its|00:06~ core|00:06~ about|00:07~ fiscal|00:07~ responsibility|00:08~ limited|00:09~ government|00:09~ or|00:09~ the|00:10~ rights|00:10~ of|00:10~ the|00:10~ individual|00:10~ but|00:11~ is|00:11~ about|00:11~ maintaining|00:12~ social|00:12~ hierarchies|00:13~ that|00:14~ it|00:14~ believes|00:14~ people|00:15~ are|00:15~ fundamentally|00:16~ unequal|00:16~ and|00:16~ likes|00:17~ the|00:17~ free|00:17~ market|00:18~ because|00:18~ it|00:18~ sorts|00:18~ people|00:19~ according|00:19~ to|00:19~ their|00:19~ Worth|00:20~ and|00:20~ even|00:20~ softly|00:21~ implies|00:21~ capitalism|00:22~ itself|00:22~ maybe|00:22~ innately|00:23~ anti-democratic|00:24~ might|00:26~ raise|00:27~ some|00:27~ eyebrows|00:28~ so|00:29~ I'm|00:29~ gonna|00:29~ show|00:29~ my|00:30~ work|00:30~ on|00:30~ this|00:30~ one|00:31~ two|00:31~ of|00:31~ the|00:31~ architects|00:32~ of|00:32~ conservative|00:33~ thought|00:33~ were|00:33~ Edmund|00:34~ Burke|00:34~ and|00:34~ Joseph|00:35~ de|00:35~ Maistre|00:35~ who|00:36~ formulated|00:36~ much|00:36~ of|00:37~ their|00:37~ political|00:37~ theory|00:38~ while|00:38~ writing|00:38~ about|00:38~ the|00:39~ French|00:39~ Revolution|00:39~ they|00:40~ in|00:40~ turn|00:40~ were|00:41~ influenced|00:41~ by|00:41~ earlier|00:42~ writings|00:42~ from|00:42~ Thomas|00:43~ Hobbes|00:43~ on|00:43~ the|00:44~ English|00:44~ Civil|00:44~ War|00:44~ and|00:45~ what|00:45~ all|00:45~ three|00:45~ of|00:46~ these|00:46~ men|00:46~ were|00:46~ doing|00:46~ in|00:47~ writing|00:47~ about|00:47~ these|00:48~ wars|00:48~ was|00:49~ defending|00:50~ the|00:50~ monarchy|00:51~ the|00:51~ sentiment|00:52~ that|00:52~ the|00:52~ masses|00:52~ should|00:53~ be|00:53~ powerless|00:54~ in|00:54~ the|00:54~ face|00:54~ of|00:54~ nobility|00:54~ was|00:55~ being|00:56~ challenged|00:57~ and|00:57~ while|00:58~ these|00:58~ men|00:58~ thought|00:59~ the|00:59~ revolutionaries|01:00~ themselves|01:00~ were|01:00~ actually|01:01~ quite|01:01~ compelling|01:02~ the|01:02~ democracy|01:03~ they|01:03~ were|01:03~ fighting|01:03~ for|01:04~ Hobbes|01:04~ Burke|01:05~ into|01:05~ maestra|01:06~ found|01:06~ repulsive|01:07~ come|01:08~ the|01:09~ end|01:09~ of|01:09~ the|01:09~ Revolution|01:09~ when|01:10~ it|01:10~ seemed|01:10~ democracy|01:11~ might|01:11~ actually|01:11~ spread|01:12~ across|01:12~ Europe|01:12~ Burke|01:13~ especially|01:14~ began|01:14~ to|01:14~ hypothesize|01:15~ ways|01:15~ that|01:16~ one's|01:16~ position|01:17~ within|01:17~ the|01:17~ aristocracy|01:18~ might|01:19~ be|01:19~ preserved|01:20~ even|01:20~ should|01:21~ the|01:21~ monarchy|01:21~ fall|01:22~ he|01:22~ turned|01:23~ his|01:23~ eye|01:23~ to|01:23~ the|01:23~ market|01:24~ so|01:25~ okay|01:25~ around|01:25~ the|01:26~ cusp|01:26~ of|01:26~ the|01:26~ 19th|01:27~ century|01:27~ the|01:27~ prevailing|01:28~ economic|01:28~ theories|01:29~ were|01:29~ those|01:29~ of|01:29~ Adam|01:30~ Smith|01:30~ who|01:30~ championed|01:31~ what's|01:31~ called|01:31~ the|01:31~ labor|01:32~ theory|01:32~ of|01:32~ value|01:33~ which|01:34~ I|01:34~ don't|01:34~ super|01:35~ want|01:35~ to|01:35~ get|01:36~ into|01:36~ because|01:36~ there's|01:37~ like|01:37~ a|01:37~ billion|01:37~ videos|01:38~ about|01:38~ it|01:38~ already|01:38~ but|01:39~ really|01:39~ briefly|01:40~ if|01:40~ you|01:41~ would|01:41~ take|01:41~ materials|01:42~ out|01:42~ of|01:43~ the|01:43~ ground|01:43~ and|01:43~ turn|01:44~ them|01:44~ into|01:44~ useful|01:45~ goods|01:45~ it|01:46~ is|01:46~ that|01:46~ labor|01:47~ that|01:47~ makes|01:48~ the|01:48~ good|01:48~ more|01:49~ valuable|01:49~ than|01:50~ the|01:50~ raw|01:50~ material|01:51~ and|01:51~ when|01:51~ someone|01:52~ buys|01:52~ that|01:52~ good|01:53~ they|01:53~ cover|01:53~ the|01:54~ cost|01:54~ of|01:54~ the|01:54~ materials|01:55~ plus|01:55~ the|01:55~ value|01:56~ your|01:56~ labor|01:57~ has|01:57~ added|01:58~ to|01:58~ them|01:58~ in|01:58~ contrast|01:59~ with|02:00~ this|02:00~ what|02:00~ Burke|02:01~ argued|02:01~ was|02:02~ well|02:02~ a|02:02~ lot|02:03~ of|02:03~ nebulous|02:03~ things|02:03~ but|02:04~ among|02:04~ them|02:04~ that|02:05~ in|02:05~ fact|02:05~ when|02:06~ a|02:06~ person|02:06~ of|02:07~ means|02:07~ buys|02:07~ a|02:07~ good|02:08~ that|02:08~ rather|02:09~ than|02:09~ the|02:09~ moment|02:10~ the|02:10~ good|02:10~ is|02:10~ produced|02:11~ is|02:11~ when|02:11~ value|02:12~ is|02:12~ bestow|02:13~ upon|02:14~ it|02:14~ value|02:15~ is|02:15~ not|02:15~ dictated|02:15~ by|02:15~ the|02:16~ producer|02:16~ but|02:17~ by|02:17~ the|02:17~ consumer|02:18~ now|02:18~ there's|02:19~ like|02:19~ two|02:19~ centuries|02:20~ of|02:20~ argument|02:21~ about|02:21~ this|02:21~ we're|02:22~ not|02:22~ gonna|02:22~ dig|02:22~ into|02:23~ it|02:23~ all|02:23~ but|02:24~ obviously|02:24~ this|02:25~ is|02:25~ in|02:25~ some|02:25~ sense|02:26~ true|02:26~ if|02:27~ the|02:27~ people|02:27~ with|02:28~ money|02:28~ don't|02:28~ want|02:28~ to|02:29~ buy|02:29~ a|02:29~ good|02:29~ at|02:29~ a|02:29~ certain|02:30~ price|02:30~ eventually|02:31~ the|02:31~ price|02:32~ will|02:32~ come|02:32~ down|02:32~ so|02:33~ price|02:33~ is|02:33~ not|02:34~ solely|02:34~ dictated|02:35~ by|02:35~ labor|02:35~ but|02:36~ what|02:36~ Bourke|02:36~ does|02:36~ is|02:37~ claim|02:37~ that|02:38~ price|02:38~ and|02:39~ value|02:39~ are|02:40~ the|02:40~ same|02:41~ thing|02:41~ no|02:42~ one|02:42~ ever|02:42~ gets|02:42~ cheated|02:42~ no|02:43~ one|02:43~ ever|02:43~ gets|02:44~ a|02:44~ good|02:44~ deal|02:44~ whatever|02:45~ the|02:45~ buyer|02:45~ pays|02:46~ for|02:46~ the|02:46~ thing|02:47~ that's|02:47~ what|02:48~ the|02:48~ thing|02:48~ is|02:48~ worth|02:49~ your|02:50~ labor|02:50~ is|02:51~ only|02:51~ as|02:51~ valuable|02:52~ as|02:52~ the|02:52~ degree|02:53~ to|02:53~ which|02:53~ it|02:53~ satisfies|02:54~ the|02:54~ desires|02:54~ of|02:55~ the|02:55~ moneyed|02:55~ classes|02:56~ this|02:57~ was|02:57~ Burke's|02:57~ nod|02:57~ to|02:58~ the|02:58~ fact|02:58~ that|02:58~ within|02:59~ capitalism|02:59~ the|03:00~ wealthy|03:01~ held|03:01~ outsized|03:01~ influence|03:02~ being|03:02~ that|03:03~ the|03:03~ more|03:03~ money|03:03~ you|03:04~ had|03:04~ the|03:04~ more|03:05~ value|03:05~ you|03:05~ could|03:06~ dictate|03:06~ and|03:06~ he|03:07~ argued|03:07~ that|03:07~ this|03:07~ was|03:08~ moral|03:08~ that|03:09~ the|03:09~ wealthy|03:09~ deserved|03:10~ this|03:10~ influence00:00~ I|00:00~ have|00:00~ suspicions|00:01~ that|00:01~ some|00:02~ of|00:02~ the|00:02~ claims|00:02~ I|00:02~ make|00:03~ in|00:03~ always|00:03~ a|00:03~ bigger|00:03~ fish|00:04~ that|00:04~ conservatism|00:05~ isn't| 00: 06~at | 00: 06~its | 00: 06~core | 00: 06~about | 00: 07~fiscal | 00: 07~responsibility | 00: 08~limited | 00: 09~government | 00: 09~or | 00: 09~the | 00: 10~rights | 00: 10~of | 00: 10~the | 00: 10~individual | 00: 10~but | 00: 11~is | 00: 11~about | 00: 11~maintaining | 00: 12~social | 00: 12~hierarchies | 00: 13~that | 00: 14~it | 00: 14~believes | 00: 14~people | 00: 15~are | 00: 15~fundamentally | 00: 16~unequal | 00: 16~and | 00: 16~likes | 00: 17~the | 00: 17~free | 00: 17~market | 00: 18~because | 00: 18~it | 00: 18~sorts | 00: 18~people | 00: 19~according | 00: 19~to | 00: 19~their | 00: 19~Worth | 00: 20~and | 00: 20~even | 00: 20~softly | 00: 21~implies | 00: 21~capitalism | 00: 22~itself | 00: 22~maybe | 00: 22~innately | 00: 23~anti - democratic | 00: 24~might | 00: 26~raise | 00: 27~some | 00: 27~eyebrows | 00: 28~so | 00: 29~I'm|00:29~ gonna|00:29~ show|00:29~ my|00:30~ work|00:30~ on|00:30~ this|00:30~ one|00:31~ two|00:31~ of|00:31~ the|00:31~ architects|00:32~ of|00:32~ conservative|00:33~ thought|00:33~ were|00:33~ Edmund|00:34~ Burke|00:34~ and|00:34~ Joseph|00:35~ de|00:35~ Maistre|00:35~ who|00:36~ formulated|00:36~ much|00:36~ of|00:37~ their|00:37~ political|00:37~ theory|00:38~ while|00:38~ writing|00:38~ about|00:38~ the|00:39~ French|00:39~ Revolution|00:39~ they|00:40~ in|00:40~ turn|00:40~ were|00:41~ influenced|00:41~ by|00:41~ earlier|00:42~ writings|00:42~ from|00:42~ Thomas|00:43~ Hobbes|00:43~ on|00:43~ the|00:44~ English|00:44~ Civil|00:44~ War|00:44~ and|00:45~ what|00:45~ all|00:45~ three|00:45~ of|00:46~ these|00:46~ men|00:46~ were|00:46~ doing|00:46~ in|00:47~ writing|00:47~ about|00:47~ these|00:48~ wars|00:48~ was|00:49~ defending|00:50~ the|00:50~ monarchy|00:51~ the|00:51~ sentiment|00:52~ that|00:52~ the|00:52~ masses|00:52~ should|00:53~ be|00:53~ powerless|00:54~ in|00:54~ the|00:54~ face|00:54~ of|00:54~ nobility|00:54~ was|00:55~ being|00:56~ challenged|00:57~ and|00:57~ while|00:58~ these|00:58~ men|00:58~ thought|00:59~ the|00:59~ revolutionaries|01:00~ themselves|01:00~ were|01:00~ actually|01:01~ quite|01:01~ compelling|01:02~ the|01:02~ democracy|01:03~ they|01:03~ were|01:03~ fighting|01:03~ for|01:04~ Hobbes|01:04~ Burke|01:05~ into|01:05~ maestra|01:06~ found|01:06~ repulsive|01:07~ come|01:08~ the|01:09~ end|01:09~ of|01:09~ the|01:09~ Revolution|01:09~ when|01:10~ it|01:10~ seemed|01:10~ democracy|01:11~ might|01:11~ actually|01:11~ spread|01:12~ across|01:12~ Europe|01:12~ Burke|01:13~ especially|01:14~ began|01:14~ to|01:14~ hypothesize|01:15~ ways|01:15~ that|01:16~ one's | 01: 16~position | 01: 17~within | 01: 17~the | 01: 17~aristocracy | 01: 18~might | 01: 19~be | 01: 19~preserved | 01: 20~even | 01: 20~should | 01: 21~the | 01: 21~monarchy | 01: 21~fall | 01: 22~he | 01: 22~turned | 01: 23~his | 01: 23~eye | 01: 23~to | 01: 23~the | 01: 23~market | 01: 24~so | 01: 25~okay | 01: 25~around | 01: 25~the | 01: 26~cusp | 01: 26~of | 01: 26~the | 01: 26~19th | 01: 27~century | 01: 27~the | 01: 27~prevailing | 01: 28~economic | 01: 28~theories | 01: 29~were | 01: 29~those | 01: 29~of | 01: 29~Adam | 01: 30~Smith | 01: 30~who | 01: 30~championed | 01: 31~what's|01:31~ called|01:31~ the|01:31~ labor|01:32~ theory|01:32~ of|01:32~ value|01:33~ which|01:34~ I|01:34~ don't | 01: 34~ super| 01: 35~want | 01: 35~to | 01: 35~get | 01: 36~into | 01: 36~because | 01: 36~there's|01:37~ like|01:37~ a|01:37~ billion|01:37~ videos|01:38~ about|01:38~ it|01:38~ already|01:38~ but|01:39~ really|01:39~ briefly|01:40~ if|01:40~ you|01:41~ would|01:41~ take|01:41~ materials|01:42~ out|01:42~ of|01:43~ the|01:43~ ground|01:43~ and|01:43~ turn|01:44~ them|01:44~ into|01:44~ useful|01:45~ goods|01:45~ it|01:46~ is|01:46~ that|01:46~ labor|01:47~ that|01:47~ makes|01:48~ the|01:48~ good|01:48~ more|01:49~ valuable|01:49~ than|01:50~ the|01:50~ raw|01:50~ material|01:51~ and|01:51~ when|01:51~ someone|01:52~ buys|01:52~ that|01:52~ good|01:53~ they|01:53~ cover|01:53~ the|01:54~ cost|01:54~ of|01:54~ the|01:54~ materials|01:55~ plus|01:55~ the|01:55~ value|01:56~ your|01:56~ labor|01:57~ has|01:57~ added|01:58~ to|01:58~ them|01:58~ in|01:58~ contrast|01:59~ with|02:00~ this|02:00~ what|02:00~ Burke|02:01~ argued|02:01~ was|02:02~ well|02:02~ a|02:02~ lot|02:03~ of|02:03~ nebulous|02:03~ things|02:03~ but|02:04~ among|02:04~ them|02:04~ that|02:05~ in|02:05~ fact|02:05~ when|02:06~ a|02:06~ person|02:06~ of|02:07~ means|02:07~ buys|02:07~ a|02:07~ good|02:08~ that|02:08~ rather|02:09~ than|02:09~ the|02:09~ moment|02:10~ the|02:10~ good|02:10~ is|02:10~ produced|02:11~ is|02:11~ when|02:11~ value|02:12~ is|02:12~ bestow|02:13~ upon|02:14~ it|02:14~ value|02:15~ is|02:15~ not|02:15~ dictated|02:15~ by|02:15~ the|02:16~ producer|02:16~ but|02:17~ by|02:17~ the|02:17~ consumer|02:18~ now|02:18~ there's | 02: 19~like | 02: 19~two | 02: 19~centuries | 02: 20~of | 02: 20~argument | 02: 21~about | 02: 21~this | 02: 21~we're|02:22~ not|02:22~ gonna|02:22~ dig|02:22~ into|02:23~ it|02:23~ all|02:23~ but|02:24~ obviously|02:24~ this|02:25~ is|02:25~ in|02:25~ some|02:25~ sense|02:26~ true|02:26~ if|02:27~ the|02:27~ people|02:27~ with|02:28~ money|02:28~ don't | 02: 28~want | 02: 28~to | 02: 29~buy | 02: 29~a | 02: 29~good | 02: 29~at | 02: 29~a | 02: 29~certain | 02: 30~price | 02: 30~eventually | 02: 31~the | 02: 31~price | 02: 32~will | 02: 32~come | 02: 32~down | 02: 32~so | 02: 33~price | 02: 33~is | 02: 33~not | 02: 34~solely | 02: 34~dictated | 02: 35~by | 02: 35~labor | 02: 35~but | 02: 36~what | 02: 36~Bourke | 02: 36~does | 02: 36~is | 02: 37~claim | 02: 37~that | 02: 38~price | 02: 38~and | 02: 39~value | 02: 39~are | 02: 40~the | 02: 40~same | 02: 41~thing | 02: 41~no | 02: 42~one | 02: 42~ever | 02: 42~gets | 02: 42~cheated | 02: 42~no | 02: 43~one | 02: 43~ever | 02: 43~gets | 02: 44~a | 02: 44~good | 02: 44~deal | 02: 44~whatever | 02: 45~the | 02: 45~buyer | 02: 45~pays | 02: 46~ for| 02: 46~the | 02: 46~thing | 02: 47~that's|02:47~ what|02:48~ the|02:48~ thing|02:48~ is|02:48~ worth|02:49~ your|02:50~ labor|02:50~ is|02:51~ only|02:51~ as|02:51~ valuable|02:52~ as|02:52~ the|02:52~ degree|02:53~ to|02:53~ which|02:53~ it|02:53~ satisfies|02:54~ the|02:54~ desires|02:54~ of|02:55~ the|02:55~ moneyed|02:55~ classes|02:56~ this|02:57~ was|02:57~ Burke's | 02: 57~nod | 02: 57~to | 02: 58~the | 02: 58~fact | 02: 58~that | 02: 58~within | 02: 59~capitalism | 02: 59~the | 03: 00~wealthy | 03: 01~held | 03: 01~outsized | 03: 01~influence | 03: 02~being | 03: 02~that | 03: 03~the | 03: 03~more | 03: 03~money | 03: 03~you | 03: 04~had | 03: 04~the | 03: 04~more | 03: 05~value | 03: 05~you | 03: 05~could | 03: 06~dictate | 03: 06~and | 03: 06~he | 03: 07~argued | 03: 07~that | 03: 07~this | 03: 07~was | 03: 08~moral | 03: 08~that | 03: 09~the | 03: 09~wealthy | 03: 09~deserved | 03: 10~this | 03: 10~influence | 03: 11~Burke | 03: 11~was | 03: 12~by | 03: 12~the | 03: 12~way | 03: 12~wealthy | 03: 13~sort | 03: 13~of | 03: 14~he | 03: 14~had | 03: 14~a | 03: 14~royal | 03: 14~pension | 03: 15~what | 03: 16~he | 03: 16~felt | 03: 16~the | 03: 16~French | 03: 16~Revolution | 03: 17~revealed | 03: 17~was | 03: 17~not | 03: 17~that | 03: 18~oppressive | 03: 18~nobility | 03: 19~was | 03: 19~bad | 03: 20~but | 03: 20~that | 03: 20~France | 03: 21~must | 03: 21~have | 03: 21~just | 03: 21~had | 03: 21~the | 03: 22~wrong | 03: 22~nobles | 03: 23~because | 03: 23~a | 03: 23~proper | 03: 24~aristocracy | 03: 25~wouldn't|03:25~ have|03:25~ been|03:26~ overthrown|03:26~ the|03:27~ problem|03:27~ was|03:27~ as|03:27~ we've | 03: 28~discussed | 03: 28~not | 03: 29~the | 03: 29~hierarchy | 03: 30~itself | 03: 30~but | 03: 31~the | 03: 31~wrong | 03: 31~people | 03: 32~being | 03: 32~ in| 03: 32~power | 03: 32~the | 03: 33~revolution | 03: 34~had | 03: 34~taught | 03: 34~him | 03: 34~that | 03: 35~perhaps | 03: 35~power | 03: 35~should | 03: 36~not | 03: 36~come | 03: 36~by | 03: 37~birthright | 03: 37~perhaps | 03: 38~we | 03: 39~needed | 03: 39~a | 03: 39~system | 03: 39~whereby | 03: 40~those | 03: 40~deserving | 03: 41~of | 03: 41~power | 03: 42~could | 03: 42~prove | 03: 43~their | 03: 43~worth | 03: 43~this | 03: 44~should | 03: 44~ideally | 03: 45~be | 03: 45~war | 03: 46~but | 03: 47~capitalism | 03: 48~would | 03: 48~suffice | 03: 48~the | 03: 49~structure | 03: 50~of | 03: 50~royalty | 03: 51~would | 03: 51~ continue| 03: 51~to | 03: 51~exist | 03: 52~simply | 03: 53~derived | 03: 53~by | 03: 53~different | 03: 54~means | 03: 54~because | 03: 55~the | 03: 55~structure | 03: 55~of | 03: 56~democracy | 03: 56~where | 03: 57~on | 03: 57~Election | 03: 57~Day | 03: 57~the | 03: 58~nobleman | 03: 58~has | 03: 59~no | 03: 59~more | 03: 59~power | 03: 59~than | 04: 00~the | 04: 00~commoner | 04: 00~was | 04: 01~ -| 04: 01~an | 04: 01~aristocrat | 04: 02~profane | 04: 03~what | 04: 04~the | 04: 04~structure | 04: 05~needed | 04: 05~was | 04: 05~some | 04: 06~tinkering | 04: 06~to | 04: 07~make | 04: 07~it | 04: 07~democracy | 04: 07~proof | 04: 08~so | 04: 09~that's|04:09~ Burke|04:09~ over|04:10~ the|04:10~ next|04:10~ century|04:11~ democracy|04:11~ did|04:12~ in|04:12~ fact|04:12~ spread|04:13~ across|04:13~ Europe|04:14~ and|04:14~ Berks|04:14~ and|04:15~ several|04:15~ others|04:16~ theories|04:16~ of|04:17~ value|04:17~ were|04:17~ picked|04:17~ up|04:18~ and|04:18~ iterated|04:18~ on|04:18~ in|04:19~ what|04:19~ came|04:19~ to|04:19~ be|04:19~ known|04:19~ as|04:19~ the|04:20~ marginal|04:21~ revolution|04:21~ by|04:22~ economists|04:22~ carl|04:23~ menger|04:23~ stanley|04:24~ jevons|04:24~ and|04:24~ this|04:25~ Valjean|04:25~ lookin|04:26~ [ __ ]|04:26~ lay|04:26~ on|04:27~ wall|04:27~[Music]|04:31~[Music]|04:31~[Music]|04:31~[Applause]|04:35~[Applause]|04:35~[Applause]|04:35~[Music]|04:40~ marginalism|04:41~ amped|04:41~ up|04:41~ the|04:41~ idea|04:42~ that|04:42~ it|04:42~ is|04:42~ a|04:43~ Goods|04:43~ utility|04:44~ to|04:44~ the|04:44~ consumer|04:45~ and|04:45~ not|04:45~ the|04:45~ workers|04:46~ labor|04:46~ that|04:46~ gives|04:47~ it|04:47~ value|04:47~ which|04:47~ confers|04:48~ a|04:48~ unique|04:48~ power|04:49~ upon|04:49~ those|04:50~ with|04:50~ money|04:50~ and|04:50~ brought|04:51~ this|04:51~ thinking|04:52~ into|04:52~ a|04:52~ post|04:53~ monarchical|04:53~ world|04:54~ their|04:54~ theories|04:55~ became|04:55~ especially|04:55~ popular|04:56~ when|04:56~ people|04:57~ realized|04:57~ they";
		const data = {
			title: 'Title of the video, something great.',
			channel: 'Some Youtuber',
			date: 'Jan. 6, 2012',
			id: 'g32xAWxkabw',
			text: text.split( '|' ).map( ( t ) => t.split( '~' ) ),
		};
		return view.render( 'captions', data );
	}

	public async urlParse( { request, response }: HttpContextContract ): Promise<void> {
		// Verify it is a youtube url
		if ( ! request.url().match( /^\/(https?:\/\/)?(www.)?youtube.com\/watch$/i ) ) {
			return response.status( 400 ).send( 'Invalid' );
		}
		// Redirect to its id
		response.redirect( '/' + request.input( 'v' ) );
	}

	public async fetchVideo( { params, view, response }: HttpContextContract ): Promise<void|string> {
		try {
			const data = await _fetchVideo( params.id );
			return view.render( 'video', data );
		} catch ( e ) {
			return FetchError.raise( response, e );
		}
	}

	public async fetchCaptions( { request, view, response }: HttpContextContract ): Promise<void | string> {
		const url = request.body().captionsurl;
		// If captions url is lacking, redirect to find it
		if ( ! url ) {
			/*TODO  url lacking
				→ Should fetch video data to try to find the proper url.
				→ If track doesn't exist, redirect to /params.id, with post to not repeat the data fetch.
			*/
			return response.status( 400 ).send( 'TO BE DONE:  here without captions file url' ); //TODO not that
		}
		// Fetch the captions
		const captions = await _fetchCaptions( url );
		//TODO  Write the egde file and view
		let text = '';
		for ( const [ t, w ] of captions ) {
			text += `${ t }~${ w }|`;
		}
		return response.status( 200 ).send( text ); //TODO not that
	}

}

/**
 * Fetch the useful video data from Youtube.
 * @param {string} id ID of the target video
 * @returns {Promise<ytData>} Object containing useful data
 * @async
 */
async function _fetchVideo( id: string ): Promise<ytData> {
	// Check the validity of the id format
	if ( ! id.match( /^[a-zA-Z0-9\-_]{11}$/ ) ) throw new FetchError( 400, 'Invalid' );
	// Fetch the data from Youtube
	const url: string = 'https://www.youtube.com/watch?v=' + id;
	let video: YtResponseExtended;
	try {
		video = await youtubedl( url, {
			dumpSingleJson: true,
			noWarnings: true,
			noCallHome: true,
			noCheckCertificate: true,
			preferFreeFormats: true,
			youtubeSkipDashManifest: true,
			referer: url,
		} );
	} catch ( e ) {
		if ( e.stderr === 'ERROR: Video unavailable' ) throw new FetchError( 404, 'Video not found' );
		// This check mught by itself raise another error that will be handled anyway.
		throw '?';
		// Possible source of error:  MSVCR100.dll missing
		// Requires Microsoft Visual C++ 2010 Service Pack 1 Redistributable 32 bits (x86)
	}
	// Read the relevant data
	const data: ytData = {
		id: id,
		title: video.title,
		channel: video.channel,
		date: dateReformat( video.upload_date ),
		captions: {},
	};
	let urls = video.automatic_captions ?? {}; // List of automatic caption. Find the url for 'vtt' in the first one.
	for ( const { ext, url } of urls[ Object.keys( urls )[ 0 ] ] ) {
		if ( ext === 'vtt' ) {
			// Remove tlang field from the url to get to default (original) language
			// Note: An alternative solution would be to identify the video language through the lang= field in those urls.
			data.captions.auto = url.replace( /(?<=\/|&)tlang=[^&]+(&|$)/, '' );
			break;
		}
	}
	urls = video.subtitles ?? {};
	for ( const lang in urls ) {
		for ( const { ext, url } of urls[ lang ] ) {
			if ( ext === 'vtt' ) {
				data.captions[ lang ] = url;
				break;
			}
		}
	}
	return data;
}

/**
 * Fetch the vtt subtitles at a given URL, as an array of timings and texts.
 * @param {string} url URL for the subtitles
 * @param {boolean} [msResolution=false] Whether the timings are accurate to the milisecond (false (default)) or to the second (true)
 * @returns {[string,string][]} List of timed texts, as a list of [<time>, <text>] (where <time> is in text format).
 * @async
 */
async function _fetchCaptions( url: string, msResolution = false ): Promise<[string, string][]> {
	// Fetch the captions
	const resp = await fetch( url );
	//TODO resp.status = 404 when not found
	if ( resp.status !== 200 ) {
		if ( resp.status === 404 ) throw new FetchError( 404, 'Captions file not found.' );
		throw 0;
	}
	const captions:string = await ( resp ).text();
	// Useful regex in reading the captions file
	const regTimeLine = /^(\d\d:\d\d:\d\d\.\d\d\d) --> \d\d:\d\d:\d\d\.\d\d\d/;
	const regTimedWord = /<(\d\d:\d\d:\d\d\.\d\d\d)><c>(.+?)<\/c>/g;
	// Read the words with their timings
	const text: [string, string][] = []; // List of [ timing, words ] to build
	let time!: string; // Last timing met
	let last!: string; // Last line met
	for ( let line of captions.split( '\n' ) ) {
		line = line.trim();
		if ( !line ) continue; // Skip empty lines
		const m = line.match( regTimeLine );
		if ( m ) { // It is a timing line
			time = m[ 1 ]; // Store showing time
			continue;
		}
		if ( time ) { // It is a text line
			if ( line.endsWith( '</c>' ) ) { // It is a line with word-level timing
				const i = text.length; // Index for the first word (to be read later)
				text.push( [ '', '' ] ); // Make some room for the first word
				text[ i ] = [ time,
					' ' +
					line.replace( regTimedWord, ( _, t, w ) => { // Read each timed word, leaving the first wors
						text.push( [ t, w ] );
						return '';
					} ),
				]; // Store the remaining first word
				last = line.replace( regTimedWord, '$2' ); // Store what was just read
			} else if ( line !== last ) text.push( [ time, line ] ); // It is a line without timing, which might be a double.
		}
	}
	// Strip the timings from excessive front characters
	if ( ! text.length ) return text;
	const zeroes = text[ text.length - 1 ][ 0 ].match( /^0*:?0?/ );
	const s = ( zeroes ) ? zeroes[ 0 ].length : 0;
	const n = ( msResolution ) ? undefined : 8 - s;
	for ( let i = 0; i < text.length; i++ ) {
		text[ i ][ 0 ] = text[ i ][ 0 ].substr( s, n );
	}
	return text;
}

/**
 * Class FetchError is used to handle errors in shared fetching functions.
 * Its static raise function also defines the default behavior for unrecognized issues.
 */
class FetchError {
	status: number;
	message: string;
	constructor( status: number, message?: string ) {
		this.status = status;
		this.message = message ?? '';
	}
	public static raise( response: ResponseContract, error?: unknown ) {
		if ( error instanceof FetchError ) {
			return response.status( error.status ).send( error.message );
		}
		return response.status( 500 ).send( 'Something went wrong' );
	}
}

/**
 * Completing YtResponse interface (Current version lacks the caption-related fields)
 */
interface YtResponseExtended extends YtResponse {
	// eslint-disable-next-line camelcase
	automatic_captions?: { [ key: string ]: { ext: string, url: string; }[] },
	subtitles?: { [ key: string ]: { ext: string, url: string; }[] },
}

/**
 * Interface for the video data kept used by the captions collection tool
 */
interface ytData {
	id: string,
	title: string,
	channel: string,
	date: string,
	captions: { [ key: string ]: string; },
}

/**
 * Convert a date in "yyyymmdd" format to a standard "Mon. dd, yyyy" (e.g. "Feb. 8, 2018")
 * @param {string} date Date to convert, in "yyyymmdd" format
 * @returns {string} Date in human format (or empty string if the input parameter doesn't match the expected format)
 */
function dateReformat( date: string ): string {
	if ( typeof date === 'string' && date.match( /^\d\d\d\d\d\d\d\d$/ ) ) {
		return (
			[ 'Jan. ', 'Feb. ', 'March ', 'Apr. ', 'May ', 'June ', 'July ', 'Aug. ', 'Sept. ', 'Oct. ', 'Nov. ', 'Dec. ' ][ Number( date.substr( 4, 2 ) ) - 1 ] +
			( Number( date.charAt( 6 ) ) || '' ) + date.charAt( 7 ) + ', ' +
			date.substr( 0, 4 )
		);
	}
	return '';
}
