# FuryModel

Generic javascript factory layer for CRUD model.

## Goal

FuryModel aims to keep your data layer consistent across your client-side application domain.
For instance, it ensures you only use one single instance of a model so change will always propagate everywhere in realtime.
It makes it easy to add any kind of relationnal dependency through a lightweight API.
Also, it keeps track of data differences between server and client so you don't have to worry about sync issue, and provides you easy ways to revert model states on error.

## What's next

- add an asynchrone hook mechanism to enable easy validation and complex async model redefinion