const { Web3 } = require("web3");
const Eth = require("web3-eth");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const { timeStamp, count } = require("console");
const readlineSync = require("readline-sync");
const readline = require("readline");
const dotenv = require('dotenv').config();
const GAS = 1000000;
const GASPRICE = "16307759490";
const url = process.env.HARDHAT;
const web3 = new Web3(url);
const bytecodePath = path.join(__dirname, "M_sol_M.bin");
const bytecode = fs.readFileSync(bytecodePath, "utf8");
const abi = require("./MyContractAbi.json");
const { PythonShell } = require("python-shell");
blackList = [];
const events = ["InstrSent", "InstrRead"];
const Nevents = ["NodeVerified", "NodeFail"];
var blackList = [];
const InstrSent_h = web3.utils.sha3(
  "InstrSent(address indexed sender, address indexed destination, string content, uint256 index)"
);
const InstrRead_h = web3.utils.sha3(
  "InstrRead(address indexed sender, address indexed destination, uint256 indx )"
);
const NodeVerified_h = web3.utils.sha3(
  "NodeVerified(address indexed source, address indexed  destination, string content)"
);
const NodeFail_h = web3.utils.sha3(
  "NodeFail(address indexed  sender, address indexed destination, string instruction)"
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function read_s(bool) {
  if (bool == false) {
    return "Unread";
  } else {
    return "Read";
  }
}

async function returnCA(ff) {
  const rl = readline.createInterface({
    input: ff,
    crlfDelay: Infinity,
  });
  let firstLine = await new Promise((resolve, reject) => {
    rl.on("line", (line) => {
      resolve(line);
      rl.close(); // Close the stream after reading the first line
    })
      .on("close", () => {
        // Handle close event if needed
      })
      .on("error", (err) => {
        reject(err);
      });
  });
  return firstLine;
}

function displayAccounts(defaultAccount, providersAccounts) {
  console.log("-".repeat(42));
  for (i = 0; i < providersAccounts.length; i++) {
    if (providersAccounts[i] == defaultAccount) {
      continue;
    }
    console.log(` ${i}. ${providersAccounts[i]}`);
  }
  console.log("-".repeat(42));
}

async function addtoList(myContract, defaultAccount, providersAccounts) {
  console.log("Accounts:\n");
  var count = 20;
  var compList = [];
  displayAccounts(defaultAccount, providersAccounts);
  while (true) {
    if (count == 0) {
      break;
    }
    d = parseInt(readlineSync.question("Choose Destination Address: "), 10);

    if (compList.includes(providersAccounts[d])) {
      console.log(
        `Address '${providersAccounts[d]}' Already Completed! Choose again\n`
      );
    } else if (d == -1) {
      break;
    } else {
      dest = providersAccounts[d];
      cc = readlineSync.question(
        "Enter Access to current node (true/false)\n:"
      );
      var ac = cc === "true";
      r = await myContract.methods.AddtoList(defaultAccount, dest, ac).send({
        from: defaultAccount,
        gas: GAS,
        gasPrice: GASPRICE,
      });
      console.log("Added to List!\nTransaction hash: ", r.transactionHash);
      compList.push(dest);
      //console.log(`Count:${count} cl: ${compList}`);
      count -= 1;
      await sleep(500);
    }
  }
}

function displayAccessList(defaultAccount, nodeList) {
  console.log(`\nGenerating AccessList for Account: ${defaultAccount}\n\n`);
  console.log("Address\t\t\t\t\t\tAccess");
  console.log("-".repeat(54));
  for (j = 0; j < nodeList.length; j++) {
    console.log(`${j + 1}. ${nodeList[j].addr}\t ${nodeList[j].access}`);
  }
  console.log("-".repeat(54));
}

async function sendinstr(myContract, defaultAccount, nodeList) {
  var allowed_addr = [];
  // displayAccounts(defaultAccount, providersAccounts);
  // _dest = providersAccounts[parseInt(readlineSync.question("Enter Destination address: "), 10)];
  /*
  const t1 = await myContract.methods.alCount(_dest).call();
  nl = await t1[0];
  await nl.forEach((e) => {
    if (e.access == true) {
      allowed_addr.append(e.addr);
    }
  });
  */
 
  while (true) {
    if (await isSenderInBlacklist(defaultAccount)){
      console.error(`Error: ${defaultAccount} in BlackList`);
      break;
     }
    _dest =
      nodeList[
        parseInt(readlineSync.question("Enter Destination address: "), 10) - 1
      ].addr;
    await sleep(500);
    //console.log(_dest);
    d = readlineSync.question('Enter Control Variables/Set Parameters');
    //dd =
    //  "[0.5, 0.2, 0.1, 0.4, 0.3, 0.5, 0.6, 0.1, 0.5, 0.1, 0.2, 0.3, 0.4, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3, 0.4, 0.2, 0.3, 0.4, 0.5, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]";
    console.log();
    console.log(
      `Sending Instruction:\nFrom:${defaultAccount}\tTo:${_dest}\nInstruction:\n${d}`
    );
    const r2 = await myContract.methods.sendInstr(_dest, d).send({
      from: defaultAccount,
      gas: GAS,
      gasPrice: GASPRICE,
    });
    console.log("Instruction Sent!:\n");
    console.log(r2);
    await sleep(500);
    q = readlineSync.question("Continue? (y/n): ");
    if (q == "n") {
      break;
    }
  }
}
//WIP

async function fetchPastEvents(myContract) {
  const eventName = "NodeStatus"; // Ensure this matches the smart contract event name
  const options = {
    fromBlock: 0,
    toBlock: "latest",
    address: myContract.options.address,
  };

  try {
    const pastEvents = await myContract.getPastEvents(eventName, options);
    console.log(`Found ${pastEvents.length} ${eventName} events.`);
    pastEvents.forEach((event) => {
      if (pastEvents.length > 0) {
        console.log("Event:", event.event);
        console.log("Return Values:", event.returnValues);
        console.log("Log:", event.log);
      }
    });
  } catch (error) {
    console.error("Error fetching past events:", error);
  }
}

async function rrr(myContract, source, providersAccounts, event) {
  console.log("LatestInstr");
  await sleep(500);
  dd = parseInt(readlineSync.question("Enter Address Index: "), 10);
  var dest = await providersAccounts[dd];
  console.log(dest);
  // Calculate the event signature hash for filtering
  const eventSignature = web3.utils.sha3(
    "InstrSent(address,address,string,uint256)"
  );

  // Assuming you want to filter by sender and destination, hash these values
  const senderHash = web3.utils.sha3(source);
  const destinationHash = web3.utils.sha3(dest);

  let options = {
    fromBlock: 0,
    toBlock: "latest",
    topics: [],
    filter: {
      sender: source,
      destination: dest,
    },
  };

  console.log("Fetching past InstrSent events...");
  await sleep(500);
  await myContract
    .getPastEvents(event, options)
    .then((events) => {
      console.log(`${events.length} InstrSent events found.`);
      events.forEach((event) => {
        console.log(
          `Event found:\nSender: ${event.returnValues.sender}\nDestination: ${event.returnValues.destination}`
        );
        console.log(event.returnValues);
        console.log(Number(event.returnValues[3]));
        return event;
      });
    })
    .catch((error) => console.error("Error fetching past events:", error));

  await sleep(500);
}

async function getAL(myContract,source) {
  
  console.log(f);
}

async function readLatestInstr_noev(myContract, source, providersAccounts) {
  await sleep(500);
  defaultAccount = source;
  const r1 = await myContract.methods.getInstr().call();
  await sleep(500);
  c = 1;
  console.log(
    `\nInstruction Mapping for Account ${defaultAccount} Retrieved.\n`
  );
  for (const i of r1) {
    let t = Number(await i.timestamp);
    let ct = moment.unix(Number(t));
    let rs = read_s(await i.isRead);
    console.log(
      `${c}.\nTo: ${await i.destination}\t DateTime: ${ct}\nInstr: ${await i.content}\nStatus: ${rs}\n`
    );
    c = c + 1;
    await sleep(500);
  }
  dd = parseInt(readlineSync.question("Enter Address Index: "), 10);

  dest_obj = r1[dd - 1];
  const dest_obj_addr = dest_obj.destination;
  await sleep(500);
  if (dest_obj.isRead == false) {
    const r2 = await myContract.methods.instrRead(dest_obj_addr).send({
      from: source,
      gas: GAS,
      gasPrice: GASPRICE,
    });
    console.log(r2);
  }
  await sleep(500);
  const r3 = await myContract.methods.getInstr().call();
  if (r3[dd - 1].isRead == true) {
    console.log("Instruction is Read");
    /*const r4 = await myContract.methods.isVerified(source, dest_obj_addr).send({
      from: source,
      gas: GAS,
      gasPrice: GASPRICE,
    }); */
    console.log("Verifying Node:\n");
    const a = "false";
    const b = "true";
    const eventName = "NodeStatus";
    const options = {
      fromBlock: 0, // Start from the beginning of the blockchain
      toBlock: "latest", // Go up to the latest block
      address: myContract.options.address, // Specify the contract address
    };
    if (await isSenderInBlacklist(source)){
      console.error(`Error: ${source} in BlackList`);
      return;
     }

    /*fetchPastEvents(myContract);    
    
    const pevents = await myContract.getPastEvents(eventName,options);
    console.log(pevents); */
    await sleep(500);
    f = await myContract.methods.alCount(source).call();
    v = 0;
    const al = f[0];
    for (j of al) {
      if(j.addr ==dest_obj_addr && j.access == true){
        v=1;
        break;
    
      }
    }

    if (v==1) {
      console.log("\nNode Authorised, Sending instruction to ADS\n\n");
      SVM_ANAL(myContract, source, dest_obj_addr);
      await sleep(5000);
    } else {
      console.log("Node Not Authorised! Address will be blacklisted.");
      blackList.push({ sender: source, instr: dest_obj });
    }
  }
}

async function readLatestInstr(myContract, source, providersAccounts) {
  await sleep(500);
  defaultAccount = source;
  const r1 = await myContract.methods.getInstr().call();
  await sleep(500);
  c = 1;
  console.log(
    `\nInstruction Mapping for Account ${defaultAccount} Retrieved.\n`
  );
  for (const i of r1) {
    let t = Number(await i.timestamp);
    let ct = moment.unix(Number(t));
    let rs = read_s(await i.isRead);
    console.log(
      `${c}.\nTo: ${await i.destination}\t DateTime: ${ct}\nInstr: ${await i.content}\nStatus: ${rs}\n`
    );
    c = c + 1;
    await sleep(500);
  }
  dd = parseInt(readlineSync.question("Enter Address Index: "), 10);

  dest_obj = r1[dd - 1];
  const dest_obj_addr = dest_obj.destination;
  await sleep(500);
  var l_index;
  var erv;
  cc = 1;
  await sleep(500);
  //await fetchPastEvents(myContract);
  const eventName = "InstrSent";
  const eventName2 = "InstrRead";
  const nodeEvents = ["NodeVerified", "NodeFail"];

  const options = {
    fromBlock: 0, // Start from the beginning of the blockchain
    toBlock: "latest", // Go up to the latest block
    topics: [], // Leave empty if you don't need to filter by topic
    address: myContract.options.address, // Specify the contract address
    filter: {
      sender: source,
      destination: dest_obj_addr,
    },
  };
  // Fetch past events
  await sleep(1000);
  //await fetchPastEvents(myContract);
  console.log("Getting Past Events");
  const pastEvents = await myContract.getPastEvents(eventName, options);
  console.log(pastEvents);
  if (pastEvents.length > 0) {
    console.log("Latest Instruction Received");
    const s = await pastEvents[0].returnValues[0];
    const d = await pastEvents[0].returnValues[1];
    console.log(s, d);
    await sleep(500);
    const r4 = myContract.methods.instrRead(dest_obj_addr).send({
      from: source,
      gas: GAS,
      gasPrice: GASPRICE,
    });
    await sleep(500);
    console.log("instr read:\n");
    const eventName2 = "InstrRead";
    const pastEvents2 = await myContract.getPastEvents(eventName2, options);
    pastEvents2.forEach((e) => {
      console.log("InstrREad\n", e);
    });
    const nodeEvents = ["NodeVerified", "NodeFail"];
    for (const ne of nodeEvents) {
      const pastEvents3 = await myContract.getPastEvents(ne, options);
      console.log(pastEvents3);
    }
  }

  /*await myContract.events[events[0]](options).on("data", (obj) => {
    console.log("Instruction Details:\n ", obj);
    console.log(
      `\nLatest Instruction from ${source} to ${providerAccounts[dd]}`
    );
    console.log("From: ", obj["returnValues"][0]);
    console.log("To: ", obj["returnValues"][1]);
    console.log("Instruction Message", obj["returnValues"][2]);
    l_index = obj["returnValues"][3];
  });*/
  await sleep(500);
  // Example usage
  /*await fetchPastEvents(myContract,source,dest_obj_addr)
    .then(() => console.log("Finished fetching past events"))
    .catch((error) => console.error("Error fetching past events:", error));*/

  /*const r3 = await myContract.methods.instrRead(dest).send({
    from: source,
    gas: GAS,
    gasPrice: GASPRICE,
  });
  var dest2;
  var r_index;
  let options2 = {
    filter: {
      sender: source,
      destination: providersAccounts[dd],
    },
    fromBlock: "latest",
  };
  await sleep(500);
  await myContract.events[events[1]](options2).on("data", (obj) => {
    console.log(
      `\nLatest Instruction from ${source} to ${providerAccounts[dd]} Read`
    );
    dest2 = obj["returnValues"][1];
    r_index = obj["returnValues"][2];
  });
  await sleep(500);
  const r4 = await myContract.methods.isVerified(source,dest2).send(
    {
      from: source,
      gas: GAS,
      gasPrice: GASPRICE,
    },
  );

  await sleep(500);
  let options3 = {
    filter: {
      sender: source,
      destination: dest2,
    },
    fromBlock: "latest",
  };
  await myContract.events[events[3]](options3).on(
    'data', (obj) => {
      console.log(obj);
    }
  );
  await sleep(500);
  await myContract.events[events[2]](options3).on(
    'data', (obj) => {
      console.log(obj);
    }
  );*/
}

async function nodeVerif(myContract, source, dest) {
  var l_index;
  var ins;
  const options = {
    fromBlock: 0,
    toBlock: "latest",
    filter: {
      sender: source,
      destination: dest,
    },
  };
  console.log("Checking for Latest Event InstrRead");
  await sleep(1000);

  await myContract.getPastEvents("InstrRead", options).then(async (events) => {
    console.log(`${events.length} InstrRead events found.`);
    el = await events;
    el.forEach((event) => {
      console.log(`Event found:\n${event.event}`);
      l_index = event.returnValues.indx;
    });
  });
  await sleep(500);
  const r1 = await myContract.methods.getInstr().call();
  c = 1;

  for (const i of r1) {
    let t = Number(await i.timestamp);
    let ct = moment.unix(Number(t));
    let rs = read_s(await i.isRead);
    c = c + 1;
    await sleep(500);
    if (c == l_index + 1) {
      ins = i;
    }
  }
  const r2 = await myContract.methods.isVerified(source, dest).send({
    from: source,
    gas: GAS,
    gasPrice: GASPRICE,
  });
  await sleep(1000);
  for (const eventName of Nevents) {
    try {
      const pastEvents = await myContract.getPastEvents(eventName, options);
      console.log(`${pastEvents.length} ${eventName} events found.`);
      pastEvents.forEach((event) => {
        console.log(
          `Event found:\nName: ${event.event}\nSender: ${event.returnValues.sender}\nDestination: ${event.returnValues.destination}\nStatus: ${event.event}`
        );
        // Process each event as needed
      });
    } catch (error) {
      console.error(`Error fetching past ${eventName} events:`, error);
    }
  }
}

async function SVM_ANAL(myContract, source, dest) {
  var insc = "";
  var ins;
  const r = await myContract.methods.getInstr().call();
  for (const i of r) {
    if (i.sender == source && i.destination == dest && i.isRead == true) {
      insc = i.content;
      ins = i;
    }
  }
  //console.log(ins);
  const instr = JSON.parse(insc);
  await sleep(500);
  //console.log(ins);
  console.log("\nSending to SVM");
  const sp = "C:/Users/jayan/OneDrive/Documents/CNCS/final/scripts/ADS/1.py";
  let op = {
    mode: "text",
    args: [instr],
  };
  PythonShell.run(sp, op).then(async (m) => {
    if (m[0] == "anomaly") {
      console.log(
        "Instruction causes an anomaly, Source address will be blacklisted."
      );
      await sleep(500);
      blackList.push({ sender: source, instr: ins });
      //console.log(blackList);

      /*const rr = await myContract.methods.addtoBL(dest).send({
        from: source,
        gas: GAS,
        gasPrice: GASPRICE,
      });
      console.log(rr);
       await sleep(500);
      /*const bl = await myContract.methods.viewBL().call();
      console.log(bl); */
    } else if (m[0]=='not-anomaly') {
      console.log('Instruction is not an Anomaly. Sending to Physical Systems.\nInstruction Details: \n',await dest_obj);
    }
  });
}
async function getInstrList(myContract, defaultAccount, providersAccounts) {
  const r = await myContract.methods.getInstr().call();
  await sleep(500);
  c = 1;
  console.log(
    `\nInstruction Mapping for Account ${defaultAccount} Retrieved.\n`
  );
  for (const i of r) {
    let t = Number(await i.timestamp);
    let ct = moment.unix(Number(t));
    let rs = read_s(await i.isRead);
    console.log(
      `${c}.\nTo: ${await i.destination}\t DateTime: ${ct}\nInstr: ${await i.content}\nStatus: ${rs}\n`
    );
    c = c + 1;
    await sleep(500);
  }
}

async function isSenderInBlacklist(sender) {
  return blackList.some(item => item.sender === sender);
}
async function main() { 
  //console.log(bytecodePath);

  ch = readlineSync.question("1.Deploy New Contract 2.Use Contract\n: ");
  ch = parseInt(ch, 10);
  if (ch == 1) {
    const myContract = new web3.eth.Contract(abi);
    myContract.handleRevert = true;
    const providersAccounts = await web3.eth.getAccounts();
    const defaultAccount = providersAccounts[0];
    console.log("Deployer account:", defaultAccount);

    const contractDeployer = myContract.deploy({
      data: "0x" + bytecode,
      arguments: [1],
    });
    try {
      const tx = await contractDeployer.send({
        from: defaultAccount,
        gas: 6721975,
        gasPrice: GASPRICE,
      });
      console.log("Contract deployed at address: " + tx.options.address);
      const timestamp = new Date().toISOString();
      const deployedAddressPath = path.join(__dirname, "MyContractAddress.txt");
      fs.writeFileSync(deployedAddressPath, tx.options.address);
      fs.appendFileSync(deployedAddressPath, `\n${timestamp}`);
    } catch (error) {
      console.error(error);
    }
  } else if (ch == 2) {
    const deployedAddressPath = path.join(__dirname, "MyContractAddress.txt");
    const ff = fs.createReadStream(deployedAddressPath);
    const contractAddress = await returnCA(ff);
    console.log(
      "Contract Instance Found!, Contract Address: ",
      contractAddress
    );
    await sleep(500);
    const myContract = new web3.eth.Contract(abi, contractAddress);
    myContract.handleRevert = true;
    const providersAccounts = await web3.eth.getAccounts();
    const defaultAccount = providersAccounts[0];
    console.log("Deployer account:", defaultAccount);

    console.log(`\n\n${providersAccounts.length} Accounts in Network`);
    if (await isSenderInBlacklist(defaultAccount)){
      console.error(`Error: ${defaultAccount} in BlackList`);
     }
    const t = await myContract.methods.alCount(defaultAccount).call();
    await sleep(500);
    acl = Number(t[1]);
    if (acl < 1) {
      console.log(
        "Access List not created. Please Provide Details for all accounts in Network!"
      );
      await sleep(500);
      addtoList(myContract, defaultAccount, providersAccounts);
      await sleep(500);
    } else {
      nodeList = await t[0];
      displayAccessList(defaultAccount, nodeList);
      console.log(`Retrieving InstrList for ${defaultAccount}`);
      insL = await myContract.methods.getInstr().call();
      if (insL.length == 0) {
        console.log("No instructions registered for User.");
        await sleep(500);
        sendinstr(myContract, defaultAccount, nodeList);
      } else {
        //ch = parseInt(readlineSync.question(""));
        sleep(1000);
        while (true){
          q = parseInt(readlineSync.question('1.Send Instruction\t2. Read & Verify\t 3.Exit\n: '),10);
          if (q==1) {
            displayAccessList(defaultAccount,nodeList);
            await sendinstr(myContract, defaultAccount, nodeList);

          }
          else if (q==2) {
             //await readLatestInstr_noev(myContract,defaultAccount,providersAccounts);
             await readLatestInstr(myContract,defaultAccount,providersAccounts);
            await sleep(1000);
          }
          else if (q==3) {
            break;
          }
          else {
            console.log('Invalid value');
          }
        }

      }
      //console.log("Events\n", myContract.events);
      //sendinstr(myContract, defaultAccount, nodeList);
      //getInstrList(myContract, defaultAccount, providersAccounts);
      await sleep(1000);
      //readLatestInstr(myContract, defaultAccount,providersAccounts);
    }
  }
}

main();
