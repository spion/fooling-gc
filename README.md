# fooling the gc

An experiment to see if a GC really is as wasteful as Rust users would have
you believe.

Run

    npm start

to compare.

Current best attempt to fool the GC is:

```
   with forced GC : 33.1 MB
with automatic GC : 67.3 MB
         increase : 34.2 MB, 103.3 %
```
