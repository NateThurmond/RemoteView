# Remote View

This project is a remote view web sharing application utilizing dom diffing technology similar to what's found in react-native. It traverses the dom tree to record differences in nodes over time that are then transmitted across via web sockets to be rendered within the Remote View service application. Included in the server folder is the application needed to service support requests. Included in the client folder is the build script for the support service library js file that can be included in other websites.

## Authors

[@NateThurmond](https://github.com/NateThurmond)

## Version History

-   0.2
    -   Consolidating Client/Server repositories
    -   Modernizing and containerizing application
-   0.1
    -   Initial Development, Demoable

## License

This project is licensed under the Apache License, Version 2.0

## References

-   [Companion Client Remote Server Application](https://github.com/NateThurmond/remoteViewServer)
