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
print(someText.substring(3, 3))

print(upper(someText))
print(lower(someText))`
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

// Print the item with index 3
print(names[3])

// Print items with indexes 0 up to (not including) 3
print(names[0 to 3])`
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
            },
            {
                title: "Classes",
                code:
`class Pet
    private name
    public procedure new(givenName)
        name=givenName
    endprocedure
    public procedure greet()
        print("Hello! I am called", name)
    endprocedure
endclass

myPet = new Pet("Silly")

myPet.greet()`
            },
            {
                title: "Classes (Inheritance)",
                code:
`class Pet
    private name
    public procedure new(givenName)
        name=givenName
    endprocedure
endclass

class Dog inherits Pet
    private breed
    public procedure new(givenName, givenBreed)
        super.new(givenName)
        breed=givenBreed
    endprocedure
endclass

myDog = new Dog("Fido", "Scottish Terrier")`
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
        mid = int(low + high / 2)
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
            },
            {
                title: "Bubble Sort",
                code: `function BubbleSort(data)
    swapped = true
    while swapped == true
        swapped = false
        for innerCount = 0 to len(data) - 2
            if data[innerCount] > data[innerCount + 1] then
                temp = data[innerCount]
                data[innerCount] = data[innerCount + 1]
                data[innerCount + 1] = temp
                swapped = true
            endif
        next innerCount
    endwhile
    return data
endfunction

array names[5]
names[0] = "Catherine"
names[1] = "Ben"
names[2] = "Elijah"
names[3] = "Dana"
names[4] = "Ahmad"
print(BubbleSort(names))`
            },
            {
                title: "Binary Search (Recursive)",
                code: `function BinarySearch(data, searchItem)
    mid = int(len(data) - 1 / 2)
    
    if len(data) == 0 then
        return false
    endif

    if data[mid] == searchItem then
        return true
    elseif data[mid] > searchItem then
        return BinarySearch(data[0 to mid], searchItem)
    else
        return BinarySearch(data[mid + 1 to len(data)], searchItem)
    endif 
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
    },
//     {
//         title: "Exam Questions",
//         examples: [
//             {
//                 title: "AS May 2019 - Question 4a",
//                 code: `// AS May 2019 - Question 4a
// // Paper: https://www.ocr.org.uk/Images/620566-question-paper-algorithms-and-problem-solving.pdf
// // Mark Scheme: https://www.ocr.org.uk/Images/620722-mark-scheme-algorithms-and-problem-solving.pdf

// // A program corrects the grammar in a line of text.
// // The text is read in from a text file.

// // a) The function, getText, needs to:
// // • take the file name as a parameter
// // • open the file
// // • read the line of data in the text file into one string
// // • return the string of data.
// //  Write the function getText

// function getText(filename)
//     file = openRead(filename)
//     dataString = file.readLine()
//     file.close()
//     return dataString
// endfunction

// print(getText("sample.txt"))`
//             },
//             {
//                 title: "AS May 2019 - Question 4b",
//                 code: `// AS May 2019 - Question 4b
// // Paper: https://www.ocr.org.uk/Images/620566-question-paper-algorithms-and-problem-solving.pdf
// // Mark Scheme: https://www.ocr.org.uk/Images/620722-mark-scheme-algorithms-and-problem-solving.pdf

// // A program corrects the grammar in a line of text.
// // The text is read in from a text file.

// // a) The function, getText, needs to:
// // • take the file name as a parameter
// // • open the file
// // • read the line of data in the text file into one string
// // • return the string of data.
// //  Write the function getText

// function getText(filename)
//     file = openRead(filename)
//     dataString = file.readLine()
//     file.close()
//     return dataString
// endfunction

// print(getText("sample.txt"))`
//             }
//         ]
//     }
]