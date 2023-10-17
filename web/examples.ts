export default [
    {
        title: "Basic Examples",
        examples: [
            {
                title: "Hello!",
                code: 'print("hello")'
            },
            {
                title: "Input Function",
                code: 'name = input("Please enter your name")\nprint("Hello", name)'
            },
            {
                title: "For Loop",
                code:
                    `for i = 0 to 7
    print("Hello")
next i`
            },
            {
                title: "While Loop",
                code:
                    `answer = ""

while answer != "computer"
    answer = input("What is the password?")
endwhile`
            },
            {
                title: "Do Until Loop",
                code:
                    `answer = ""

do
    answer = input("What is the password?")
until answer == "computer"`
            },
            {
                title: "If/Else",
                code:
                    `entry = input("Enter id: ")

if entry == "a" then
    print("You selected A")
elseif entry == "b" then
    print("You selected B")
else
    print("Unrecognised selection")
endif`
            },
            {
                title: "Switch",
                code:
                    `entry = input("Enter id: ")

switch entry:
    case "A": 
        print("You selected A")
    case "B":
        print("You selected B")
    default:
        print("Unrecognised selection")
endswitch
`
            },
            {
                title: "String Handling",
                code:
                    `someText = "Computer Science"
print(someText.length)
print(someText.substring(3, 3))`
            },
            {
                title: "Functions",
                code:
                    `function triple(number)
    return number * 3
endfunction

print(triple(7))
`
            },
            {
                title: "Procedures",
                code:
                    `procedure greeting(name)
    print("Hello " + name)
endprocedure

greeting("Harrison")
`
            },
            {
                title: "Arrays",
                code:
                    `array names[5]
names[0] = "Ahmad"
names[1] = "Ben"
names[2] = "Catherine"
names[3] = "Dana"
names[4] = "Elijah"
print(names[3])`
            },
            {
                title: "2D Arrays",
                code:
                    `array board[8, 8]
board[0, 0] = "rook"

print(board[0, 0])`
            },
            {
                title: "Read line from file",
                code:
                    `myFile = openRead("sample.txt")
x = myFile.readLine()
myFile.close()`
            },
            {
                title: "Read all lines from file",
                code:
                    `myFile = openRead("sample.txt")

while NOT myFile.endOfFile()
    print(myFile.readLine())
endwhile

myFile.close()`
            },
            {
                title: "Add line to file",
                code:
                    `myFile = openWrite("sample.txt")
myFile.writeLine("Hello World")
myFile.close()`
            },
            {
                title: "Comments",
                code:
                    `print("Hello World") // This is a comment`
            }

        ]
    },
    {
        title: "Algorithms",
        examples: [
            {
                title: "Linear Search",
                code: `function LinearSearch(searchList, searchItem)
    searchIndex = 0
    while searchIndex < len(searchList)
        if searchList[searchIndex] == searchItem then
            return true
        endif
        searchIndex = searchIndex + 1
    endwhile
    return false
endfunction

array names[5]
names[0] = "Ahmad"
names[1] = "Ben"
names[2] = "Catherine"
names[3] = "Dana"
names[4] = "Elijah"

print(LinearSearch(names, "Ben"))`
            },
            {
                title: "Binary Search",
                code: `function BinarySearch(searchList, searchItem)
    low = 0 
    high = len(searchList) - 1 
    while low <= high
        mid = int((low + high) / 2)
        if searchList[mid] == searchItem then
            return true 
        elseif searchList[mid] > searchItem then
            high = mid - 1 
        else
            low = mid + 1 
        endif 
    endwhile 
    return false
endfunction

array names[5]
names[0] = "Ahmad"
names[1] = "Ben"
names[2] = "Catherine"
names[3] = "Dana"
names[4] = "Elijah"

print(BinarySearch(names, "Ben"))`
            }
        ]
    }
]