# Nexus adult blocklist pipeline

The release build should fetch or vendor a pinned copy of StevenBlack's `porn-only` hosts snapshot and run `generate_nexus_adult_blocklist.py` to produce native C++ data.

Source:
https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts

The upstream project publishes the porn-only variant separately and records the number of unique domains in its generated readme. The source project is MIT licensed; retain its copyright notice when redistributing source data.

Do not replace this source with the broader unified hosts file: the broader file includes adware, malware, tracking and other categories and would violate Nexus's requirement to avoid unnecessary interference with normal internet use.
