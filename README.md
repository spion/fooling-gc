# fooling the gc

An experiment to see if a GC really is as wasteful as Rust users would have
you believe.

Run

    npm start

to compare.

My current best attempt to fool the GC is:

       with forced GC : 51.8 MB
    with automatic GC : 67.9 MB
             increase : 16.1 MB (31.1 %)


