/*
    this script handle few helper funtion that is required by my google sheet that handles my meal plan for a week
    it also creates tasks on my Google Tasks apps under Groceries list (⌐■_■)
*/
function populateSheetNamesExcludingCurrent() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var currentSheet = spreadsheet.getActiveSheet();
  var currentSheetName = currentSheet.getName();
  var sheetNames = spreadsheet.getSheets().map(function(sheet) {
    return sheet.getName();
  });

  // Filter out the name of the current sheet and "Week" sheets
  var filteredSheetNames = sheetNames.filter(function(name) {
    return name !== currentSheetName && !name.startsWith("Week") && name !== "Meal Names" && name !== "Ingredients";
  });

  // Get the target sheet where you want to populate the names
  var targetSheet = spreadsheet.getSheetByName("Meal Names");

  // Clear any existing data in the target sheet
  targetSheet.clear();

  // Populate the filtered sheet names in the target sheet
  targetSheet.getRange(1, 1, filteredSheetNames.length, 1).setValues(filteredSheetNames.map(function(name) {
    return [name];
  }));
}

function sumIngredients() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var activeSheet = spreadsheet.getActiveSheet();
  var targetSheetNames = activeSheet.getRange("B1:B7").getValues(); // Get values in B1 to B7
  targetSheetNames = targetSheetNames.map(function(row) {
    return row[0]; // Assuming you want values from the first (and only) column
  });

  // Create an object to store ingredient quantities
  var ingredientQuantities = {};

  // Define the sheet names to exclude
  var excludeSheetNames = ["Ingredients", "Meal Names"];
  
  // Loop through all sheets except the target sheets and excluded sheets
  spreadsheet.getSheets().forEach(function(sheet) {
    var sheetName = sheet.getName();
    if (
      targetSheetNames.indexOf(sheetName) !== -1 &&
      excludeSheetNames.indexOf(sheetName) === -1 &&
      !sheetName.startsWith("Week")
    ) {
      var data = sheet.getRange("A2:B" + sheet.getLastRow()).getValues(); // Assuming data starts from row 2
      data.forEach(function(row) {
        var ingredient = row[0];
        var quantity = row[1];
        if (ingredient && quantity) {
          // Add or update the quantity for the ingredient
          if (!ingredientQuantities[ingredient]) {
            ingredientQuantities[ingredient] = 0;
          }
          ingredientQuantities[ingredient] += quantity;
        }
      });
    }
  });

  // Get the current active cell
  var activeCell = activeSheet.getActiveCell();

  // Write the summed ingredient quantities to the current cell and the cell to the right
  for (var ingredient in ingredientQuantities) {
    activeCell.setValue(ingredient);
    activeCell.offset(0, 1).setValue(ingredientQuantities[ingredient]);
    activeCell = activeCell.offset(1, 0); // Move to the next row
  }
}

function addTasktoTaskList(grocery_list_name, title, note) {
  // var grocery_list_name = "bHdEOTRmdGMxcVF1WDc3Sg";
  const optionalArgs = {
    maxResults: 10
  };
  try {
    // Returns all the authenticated user's task lists.
    const response = Tasks.Tasklists.get(grocery_list_name);
    // const taskLists = response.items;
    // Print task list of user if available.
    // if (!taskLists || taskLists.length === 0) {
    //   console.log('No task lists found.');
    //   return;
    // }
    let request = {
      title: title,
      notes: '' + note
    }
    Tasks.Tasks.insert(request, grocery_list_name);
    console.log("Added Item %s with Quantity %s", title, note);

  } catch (err) {
    // TODO (developer) - Handle exception from Task API
    console.log('Failed with error %s', err.message);
  }
}

function listTaskLists(listname) {
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
      if(listname === taskList.title)
        return taskList.id;
    }
  } catch (err) {
    // TODO (developer) - Handle exception from Task API
    console.log('Failed with an error %s ', err.message);
  }
  return;
}

function clearOutTasks(grocer_list_id) {
  console.log("Removing Current Tasks in Groceries");

  const tasks = Tasks.Tasks.list(grocer_list_id);
  if (!tasks.items) {
    console.log('No tasks found.');
    return;
  }

  for (let i = 0; i < tasks.items.length; i++) {
    const task = tasks.items[i];
    console.log('Task with title "%s" was found.', task.title);
    Tasks.Tasks.remove(grocer_list_id, task.id);
    console.log('Task with title "%s" was Removed.', task.title);
  }
  // Tasks.Tasks.remove()
}

function extractIngredientsAndQuantities() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var activeSheet = spreadsheet.getActiveSheet();
  var activeCell = activeSheet.getActiveCell();
  var rowNum = activeCell.getRow();
  var grocery_list_name = "Groceries";

  var grocer_list_id = listTaskLists(grocery_list_name);

  // clear out current tasks first
  clearOutTasks(grocer_list_id);

  if (!grocer_list_id){
    console.log("Error: could not find Groceries list");
    return;
  }

  while (true) {
    // Get the ingredient name from the current cell
    var ingredientNameCell = activeSheet.getRange(rowNum, activeCell.getColumn());
    var ingredientName = ingredientNameCell.getValue();
    
    // Check if the ingredient name cell is empty
    if (!ingredientName) {
      console.log('No more ingredients found. Stopping.');
      break;
    }
    
    // Get the quantity from the cell in the next column (to the right)
    var quantityCell = ingredientNameCell.offset(0, 1);
    var quantity = quantityCell.getValue();
    
    // Use ingredientName and quantity as needed
    console.log('Ingredient Name: ' + ingredientName);
    console.log('Quantity: ' + quantity);
    addTasktoTaskList(grocer_list_id,ingredientName, quantity);
    // Move to the next row
    rowNum++;
  }
}

function onChange(e) {
  if (e.changeType === "INSERT_GRID" || e.changeType === "REMOVE_GRID" || e.changeType === "EDIT") {
    // A sheet was added, deleted, or renamed, so update the sheet names list
    populateSheetNamesExcludingCurrent();
  }
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Scripts')
      .addItem('Update Sheet Names', 'populateSheetNamesExcludingCurrent')
      .addItem('Sum Ingredients', 'sumIngredients')
      .addItem('Add to Google tasks', 'extractIngredientsAndQuantities')
      .addToUi();
}
