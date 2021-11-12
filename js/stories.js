"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story, showDelete = false) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();

  //only show the star if a user is signed in
  const showStar = Boolean(currentUser);

  return $(`
      <li id="${story.storyId}">
        ${showDelete ? getDeleteBtn() : ""}
        ${showStar ? getStarHTML(story, currentUser) : ""}
         <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

//make a delete button for stories
function getDeleteBtn() {
  return `<button class="deleteBtn">&times</button>`;
}

//make "favorited" star for stories

function getStarHTML(story, user) {
  const isFavorite = user.isFavorite(story);
  const starType = isFavorite ? "fas" : "far";
  return `
  <span class="star">
  <i class="${starType} fa-star"></i>
  </span>
  `;
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

// Take data from submit form to add new story
async function postStory(e) {
  e.preventDefault();
  console.debug("postStory");
  //pull data from form
  let title = $("#story-title").val();
  let url = $("#story-url").val();
  let author = $("#story-author").val();
  let username = currentUser.username;
  let storyData = { title, url, author, username };
  //execute addStory function (includes POST)
  let story = await storyList.addStory(currentUser, storyData);
  // take return and put in markup function
  let $story = generateStoryMarkup(story);
  //take marked up story and add to the DOM
  $allStoriesList.prepend($story);
  //hide form and reset
  $storyForm.hide();
  $("#story-title").val("");
  $("#story-url").val("");
  $("#story-author").val("");
}

$storyForm.on("submit", postStory);

//clicking star favorites or unfavorites the story

async function toggleStoryFavorite(e) {
  console.debug("toggleStoryFavorite");

  const $tgt = $(e.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");
  const story = storyList.stories.find((s) => s.storyId === storyId);

  //see if item is already favorited by looking at star
  if ($tgt.hasClass("fas")) {
    //is currently a favorite so remove from favs list and change star
    await currentUser.removeFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  } else {
    //currently not a favorite, so add to list and change star
    await currentUser.addFavorite(story);
    $tgt.closest("i").toggleClass("fas far");
  }
}
//add click event to the stars
$body.on("click", ".star", toggleStoryFavorite);

//remove story on button click

async function deleteStory(e) {
  console.debug("deleteStory");
  const $tgt = $(e.target);
  const $closestLi = $tgt.closest("li");
  const storyId = $closestLi.attr("id");

  await storyList.removeStory(currentUser, storyId);

  await displayUserStories();
}

//add click event to delete buttons
$ownStories.on("click", ".deleteBtn", deleteStory);

//put favorites list on page

function displayFavoritesList() {
  console.debug("displayFavoritesList");

  $favoritedStories.empty();

  if (currentUser.favorites.length === 0) {
    $favoritedStories.append(`<h5>No favorites yet!!!</h5>`);
  } else {
    //loop through all of user's favorites and put their HTML in DOM
    for (let story of currentUser.favorites) {
      const $story = generateStoryMarkup(story);
      $favoritedStories.append($story);
    }
  }
  $favoritedStories.show();
}

//put own stories on page

function displayUserStories() {
  console.debug("displayUserStories");

  $ownStories.empty();

  if (currentUser.ownStories.length === 0) {
    $ownStories.append(`<h5>You have not posted any stories!</h5>`);
  } else {
    //loop through all of user posts and put their HTML in DOM
    for (let story of currentUser.ownStories) {
      const $story = generateStoryMarkup(story, true);
      $ownStories.append($story);
    }
  }
  $ownStories.show();
}
