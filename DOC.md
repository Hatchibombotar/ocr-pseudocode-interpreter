# Details of implementation
Documentation of aspects of the interpreter that are hard to get your head around.

## Scoping with Classes
When a class is created with the new keyword, a new environment is created within the environment the class is declared within. e.g. with
```
// new scope is located here

class Pet
    private name
    public procedure new(givenName)
        name=givenName
    endprocedure
    public procedure greet()
        print("Hello! I am called", name)
    endprocedure
endclass

if condition then
    // not inside here
    myPet = new Pet("Bob")
    myPet.greet()
endif
```

This environment is where all methods are ran from within.

In the case of with a super class, the super class' internal environment is also created within the scope the super class is created in.