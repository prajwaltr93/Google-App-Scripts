/*
	Creating Goal Trackers on Google tasks based on tasks created on Google Sheets
*/
function createGoalSheets(goalsData, goalName, i) {
  // TODO: use a global json to keep track of column indexes
  var goalSetDate = new Date(goalsData[i][3]); // Assuming "Goal Set Date" is in column D
  var goalEndDate = new Date(goalsData[i][4]); // Assuming "Goal End/Revise Date" is in column E
  var targetHoursPerDay = goalsData[i][6]; // Assuming "Target Hours /day" is in column G
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var newSheet = ss.insertSheet(goalName);
  
  // Create Headers for the new sheet
  newSheet.getRange("A1").setValue("Date");
  newSheet.getRange("B1").setValue("Hours Target");
  newSheet.getRange("C1").setValue("Hours Tracked");
  
  // Populate the Date column with dates between goalSetDate and goalEndDate
  var currentDate = new Date(goalSetDate);
  var row = 2;
  while (currentDate <= goalEndDate) {
    newSheet.getRange(row, 1).setValue(currentDate);
    newSheet.getRange(row, 2).setValue(targetHoursPerDay);
    row++;
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

function insertOrCreateTaskList(taskName) {
  try {
    // Returns all the authenticated user's task lists.
    const taskLists = Tasks.Tasklists.list();
    // If taskLists are available then print all tasklists.
    if (!taskLists.items) {
      console.log('No task lists found.');
      return;
    }
    // Print the tasklist title and tasklist id.
    for (let i = 0; i < taskLists.items.length; i++) {
      const taskList = taskLists.items[i];
      console.log('Task list with title "%s" and ID "%s" was found.', taskList.title, taskList.id);
      if(taskName === taskList.title)
        return taskList.id;
    }

    // taskList not found, so create one !
    const request = {
      title: taskName
    }
    const taskListResponse = Tasks.Tasklists.insert(request);
    return taskListResponse.id;

  } catch (err) {
    // TODO (developer) - Handle exception from Task API
    console.log('Failed with an error %s ', err.message);
  }
  return;
}

function testAddGoalGoogleTasks() {
  // Replace this with actual data from your "Goals" sheet
  var goalsData = [
    // Example data for testing
    // [Goal Name, Status, Goal Set Date, Goal End/Revise Date, ..., Target Hours /day, ...]
    ["Goal 1", "In-Progress", "", "2023-10-20", "2023-10-25", "", 4, "..."],
    ["Goal 2", "In-Progress", "", "2023-10-22", "2023-10-27", ".." , 5, "..."]
    // Add more goal data as needed
  ];
  
  for (var i = 0; i < goalsData.length; i++) {
    var goalName = goalsData[i][0]; // Goal Name
    var status = goalsData[i][1]; // Status
    var index = i; // Index in the goalsData array
    
    if (status === "In-Progress") {
      addGoalGoogleTasks(goalsData, goalName, index);
      console.log("Tasks added for goal: " + goalName);
    } else {
      console.log("Goal " + goalName + " is not in progress. Skipping.");
    }
  }
}

function addGoalGoogleTasks(goalsData, goalName, index) {
  // create a function addGoalGoogleTasks that take goalName, TargetHours
  // this function to create a TaskList with name "goalName"
  const taksListId = insertOrCreateTaskList(goalName);

  // Get Target Date's and Hour's
  var goalSetDate = new Date(goalsData[index][3]); // Assuming "Goal Set Date" is in column D
  var goalEndDate = new Date(goalsData[index][4]); // Assuming "Goal End/Revise Date" is in column E
  var targetHoursPerDay = goalsData[index][6]; // Assuming "Target Hours /day" is in column G
  
  // create tasks with task name ranging from start Date and End Date
  try {
    while (goalSetDate <= goalEndDate) {
        let request = {
          title: goalSetDate,
          // notes: '' + note
        }
        var parentTask = Tasks.Tasks.insert(request, taksListId);
        // for each task created with date as task name create subtasks whose names start 
        // from 0 to target Hours
        for (var i = 0; i <= targetHoursPerDay; i++) {
          let request = {
              title : i + ""
          }

          let parent_json = {
            parent: parentTask.id
          }

          Tasks.Tasks.insert(request, taksListId, parent_json);
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

  } catch (err) {
    // TODO (developer) - Handle exception from Task API
    console.log('Failed with error %s', err.message);
  }
}

function createGoalTrackers() {
  // create Sheets for goals that are in Sheet "Goals" under column "Goal Name" with corresponding status set to "In-Progress" under column "Status"
  // for each Sheet created for each goal, create Columns Date, Hours Target, Hours Tracked
  // Date should have rows starting from date mentioned in column "Goal Set Date", ending with date mentioned in"Goal End/Revise Date"
  // Hours Target should have value specified in column "Target Hours /day"
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var goalsSheet = ss.getSheetByName("Goals");
  var goalsData = goalsSheet.getDataRange().getValues();
  
  // Loop through each row in the "Goals" sheet to create a new sheet for each goal
  for (var i = 1; i < goalsData.length; i++) { // Starting from row 2 (assuming row 1 is header)
    var goalName = goalsData[i][0]; // Assuming "Goal Name" is in column A
    
    // Check if the sheet already exists
    if (!ss.getSheetByName(goalName)) {
      var status = goalsData[i][1]; // Assuming "Status" is in column B
      
      if (status === "In-Progress") {
        // create sheets with Dates, Target Hours, Hours Tracked
        createGoalSheets(goalsData, goalName, i);
        // Create Google Tasks 
        addGoalGoogleTasks(goalsData, goalName, i)
      }
  }
  }
}

// setup scripts to have shorcuts to execute functions
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Scripts')
      .addItem('Create Goal Trackers', 'createGoalTrackers')
      // .addItem('Sum Ingredients', 'sumIngredients')
      // .addItem('Add to Google tasks', 'extractIngredientsAndQuantities')
      .addToUi();
}
