# 📍 Meet-in-the-Middle App

## Overview  
The **Meet-in-the-Middle App** helps groups plan hangouts by finding the best meetup spot based on everyone’s starting locations, preferences, and availability.  
The app also includes chat, live routes, and event recommendations, making it simple to go from planning to meeting up.  

![Preview](https://github.com/yerin16/meet-in-the-middle/blob/main/images/intro-1.png?raw=true)

## Features  

### 1) Search Places  
- **Nearby places:** See places around your current location or a selected location anywhere in the world.  
- **Place details:** Click a place to view distance, travel time, location, reviews, and pictures. You can also create a trip directly from that place.  
- **Filters:** Filter results by categories such as stadium, tourist attraction, point of interest, or establishment.  
- **Transportation options:** Check how long it takes and how far it is to reach each place by driving, walking, bicycling, or transit.

![Search Function 1](https://github.com/yerin16/meet-in-the-middle/blob/main/images/serach-1.png?raw=true)

![Search Function 2](https://github.com/yerin16/meet-in-the-middle/blob/main/images/serach-2.png?raw=true)

### 2) Create a Group & Trip  
- **Group creation:** Create a group and invite people, with a chat function to talk with members.  
- **Trip setup:** Set trip name, start date/time, and end date/time. Each participant selects their current location and preference categories (e.g., zoo, museum, stadium).  
- **Best locations:** Click **Find Best Location** to get the top 10 best locations based on group preferences and middle location.  
- **Availability check:** See whether members are available during the trip time for each option.  
- **Routes for everyone:** After selecting a spot, view every member’s route to the destination with different transportation options (driving, walking, bicycling, transit). All members’ starting points are shown together.  
- **Google Maps link:** Open the trip directly in Google Maps.

![Trip Function 1](https://github.com/yerin16/meet-in-the-middle/blob/main/images/trip-1.png?raw=true)

![Trip Function 2](https://github.com/yerin16/meet-in-the-middle/blob/main/images/trip-2.png?raw=true)

![Trip Function 3](https://github.com/yerin16/meet-in-the-middle/blob/main/images/trip-3.png?raw=true)

![Trip Function 4](https://github.com/yerin16/meet-in-the-middle/blob/main/images/trip-4.png?raw=true)

### 3) Upcoming Events  
- **Event list:** View upcoming events and performances near your current or selected location.  
- **Ticket link:** Click **Get Ticket** to go to the ticketing website.  

![Event Function 1](https://github.com/yerin16/meet-in-the-middle/blob/main/images/event-1.png?raw=true)

## Tech Stack (Decision Matrix-Based)  
We evaluated multiple technologies for each component of the app using decision matrices (see `/decision-matrix.pdf`).  

### Database  
- Options considered: Supabase, MongoDB, Firebase, Neo4j  
- Selected: **Supabase** — scored highest overall (18), with strong support for real-time updates and relational structure:contentReference[oaicite:1]{index=1}.  

### Backend  
- Options considered: Django, tRPC, NestJS, Laravel  
- Selected: **tRPC** — top score (25), providing type safety, seamless frontend-backend integration, and good scalability:contentReference[oaicite:2]{index=2}.  

### Frontend  
- Options considered: Swift (native), React Native, Flutter  
- Selected: **React Native** — highest score (19), balancing cross-platform support, large developer community, and performance:contentReference[oaicite:3]{index=3}.  

> See the [Decision Matrix PDF](./decision-matrix.pdf) for detailed comparisons and scoring.  


## 🚀 Getting Started  

### Prerequisites  
- Node.js (v18+)  
- pnpm  
- Supabase account  

### Installation  
```bash
# Clone the repository
git clone https://github.com/yourusername/meet-in-the-middle.git
cd meet-in-the-middle

# Install dependencies
pnpm install

# Run the app
pnpm start
