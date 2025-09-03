# 📍 Meet-in-the-Middle App

The **Meet-in-the-Middle App** helps groups plan hangouts by finding the best meetup spot based on everyone’s starting locations, preferences, and availability.  
The app also includes chat, live routes, and event recommendations, making it simple to go from planning to meeting up.  

![Preview](https://github.com/yerin16/meet-in-the-middle/blob/main/images/intro-1.png?raw=true)


## Table of Contents  
- [Features](#features)  
  - [1) Search Places](#1-search-places)  
  - [2) Create a Group & Trip](#2-create-a-group--trip)  
  - [3) Upcoming Events](#3-upcoming-events)  
- [Tech Stack (Decision Matrix-Based)](#tech-stack-decision-matrix-based)  
  - [Database](#database)  
  - [Backend](#backend)  
  - [Frontend](#frontend)  
- [Getting Started](#getting-started)  


## Features  

### 1) Search Places  
- **Nearby places:** See places around your current location or a selected location anywhere in the world.  
- **Place details:** Click a place to view distance, travel time, location, reviews, and pictures. You can also create a trip directly from that place.  
- **Filters:** Filter results by categories such as stadium, tourist attraction, point of interest, or establishment.  
- **Transportation options:** Check how long it takes and how far it is to reach each place by driving, walking, bicycling, or transit.

![Search Function 1](https://github.com/yerin16/meet-in-the-middle/blob/main/images/search-1.png?raw=true)
*Search nearby places and filter results*

![Search Function 2](https://github.com/yerin16/meet-in-the-middle/blob/main/images/search-2.png?raw=true)
*See place details and transportation information*

### 2) Create a Group & Trip  
- **Group creation:** Create a group and invite people, with a chat function to talk with members.  
- **Trip setup:** Set trip name, start date/time, and end date/time. Each participant selects their starting location and preference categories (e.g., zoo, museum, stadium).  
- **Best locations:** Click **Find Best Location** to get the top 10 best locations based on group preferences and middle location.  
- **Availability check:** See whether the locations are available during the trip time for each option.  
- **Routes for everyone:** After selecting a spot, view every member’s route to the destination with different transportation options (driving, walking, bicycling, transit). All members’ starting points are shown together.  
- **Google Maps link:** Open the trip directly in Google Maps.

![Trip Function 1](https://github.com/yerin16/meet-in-the-middle/blob/main/images/trip-1.png?raw=true)
*Create a new group and text in the group chat*

![Trip Function 2](https://github.com/yerin16/meet-in-the-middle/blob/main/images/trip-2.png?raw=true)
*Create a new trip and select your starting location and preference categories*

![Trip Function 3](https://github.com/yerin16/meet-in-the-middle/blob/main/images/trip-3.png?raw=true)
*Click "Find Best Location" button to get the top 10 best spots based on group preferences and middle location and select a spot to meetup*

![Trip Function 4](https://github.com/yerin16/meet-in-the-middle/blob/main/images/trip-4.png?raw=true)
*After choosing a spot, view every memebr's route to the destination with different transportation options*

### 3) Upcoming Events  
- **Event list:** View upcoming events and performances near your current or selected location.  
- **Ticket link:** Click **Get Ticket** to go to the ticketing website.  

![Event Function 1](https://github.com/yerin16/meet-in-the-middle/blob/main/images/event-1.png?raw=true)
*Discover upcoming events near your current or selected location and navigate to the ticketing website*

## Tech Stack (Decision Matrix-Based)  
We evaluated multiple technologies for each component of the app using decision matrices (see `/decision-matrix.pdf`).  

### Database  
- Options considered: Supabase, MongoDB, Firebase, Neo4j  
- Selected: **Supabase** — scored highest overall (18), with strong support for real-time updates and relational structure.  

### Backend  
- Options considered: Django, tRPC, NestJS, Laravel  
- Selected: **tRPC** — top score (25), providing type safety, seamless frontend-backend integration, and good scalability.  

### Frontend  
- Options considered: Swift (native), React Native, Flutter  
- Selected: **React Native** — highest score (19), balancing cross-platform support, large developer community, and performance.  

> See the [Decision Matrix PDF](./decision-matrix.pdf) for detailed comparisons and scoring.

## Getting Started  

### Prerequisites  
- Node.js (v18+)  
- pnpm  
- Supabase account  
- Google Cloud account with **Google Maps API key** (for Places, Directions, and Routes)  
- Ticketmaster Developer account with **API key** (for events and ticketing data)  

### Installation  
```bash
# Clone the repository
git clone https://github.com/yourusername/meet-in-the-middle.git
cd meet-in-the-middle

# Install dependencies
pnpm install

# Run the app
pnpm start