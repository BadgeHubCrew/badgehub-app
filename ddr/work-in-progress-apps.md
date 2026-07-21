# Work in progress apps

BadgeHub needs to let developers publish projects while clearly indicating that
the project is still a work in progress. This status is useful in the web
catalog, but it is also useful for badge/device launchers that receive copied
project files and need enough local metadata to present the project correctly.

BadgeHub already stores project package metadata in `metadata.json`, represented
in code as `AppMetadataJSON`. That metadata is versioned and published with the
project files.

## Decision: development_status as an enum instead of a work_in_progress boolean
We decided to make the development_status a string enum field for extensibility. In the future, something like "archived" could be added.

## Decision: if development_status is not set, an app's development_status should be treated as stable by clients.
An important principle used in BadgeBub api decisions is that a minimal metadata.json should work. We want as little as possible mandatory fields to make it easy to make a valid metadata.json for random app developers.
The default for an app is to be not to be "work in progress" and so clients should treat an app without the development_status in it's metadata.json as stable.

## Decision: when an app is created, the development_status is not set
We were thinking about starting an app as "work in progress" by default when the project creation api is used. But this would be very unintuitive because we have declared that stable is the default. 
Then the create api would set an app to work in progress but then if you used the metadata update api, it would get defaulted to stable. So we chose to leave the development_status unset for the project creation api. 

## Decision: development_status in metadata.json
We decided to put the development_status as a field in de app's metadata.json file.
An important principle used in BadgeBub api decisions is that an app can be installed on a device and shown by the launcher by just copying the files over to some location.
This means that all data that can be useful to a launcher on a badge should be in the metadata json file rather than stored in the badgehub database only.
Since we think development_status can be useful to a launcher, we decided to put it in the app's metadata json.


