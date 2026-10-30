let HumanScore=0;

let ComputerScore=0;

function getComputerChoice(){
    let c=Math.random();
    let move="";
    if(c>=0.666666){
        move="rock";
    }else if(c>=0.33333){
        move="paper";
    }else {
        move="scissors";
    }
    return move;
}

function getHumanChoice(){
    let p=prompt("Enter your move( rock / paper / scissors ) : ");
    let um=p.toLowerCase();
    return um;
}

function playRound(humanSelection ,computerSelection){
    if(humanSelection==="rock" && computerSelection==="scissors"){
        HumanScore++;
    }
    else if(humanSelection==="paper" && computerSelection==="rock"){
        HumanScore++;
    }
    else if(humanSelection==="scissors" && computerSelection==="paper"){
        HumanScore++;
    }
    else if(humanSelection==="scissors" && computerSelection==="scissors"){
        HumanScore+=0;
        ComputerScore+=0;
    }
    else if(humanSelection==="paper" && computerSelection==="paper"){
        HumanScore+=0;
        ComputerScore+=0;
    }
    else if(humanSelection==="rock" && computerSelection==="rock"){
        HumanScore+=0;
        ComputerScore+=0;
    }
    else{
        ComputerScore++;
    }
}


// FIVE ROUNDS:

let count=5;


while(count>0){
    const computerSelection=getComputerChoice();
    const humanSelection = getHumanChoice();
    playRound(humanSelection, computerSelection);
    count--;
}



function win(HumanScore,ComputerScore){
    if(HumanScore>ComputerScore){
        console.log("Your Score : "+HumanScore+" Computer's Score : "+ComputerScore);
        console.log("You Win !!!"); 
    }
    else if(HumanScore<ComputerScore){
        console.log("Your Score : "+HumanScore+" Computer's Score : "+ComputerScore);
        console.log("Computer Wins !!!"); 
    }
    else{
        console.log("Your Score : "+HumanScore+" Computer's Score : "+ComputerScore);
        console.log("Game Tied !!!"); 
    }
}


win(HumanScore,ComputerScore);  