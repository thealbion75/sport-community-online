
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Award, MapPin, Clock } from 'lucide-react';

/**
 * Sports Council Page
 * Information about East Grinstead Sports Council meetings, speakers, and outcomes
 */
const SportsCouncil = () => {
  const upcomingMeetings = [
    {
      id: 1,
      date: "March 15, 2024",
      time: "7:30 PM",
      venue: "East Grinstead Tennis Club",
      address: "Saint Hill Road, East Grinstead",
      speaker: "Sarah Johnson",
      speakerRole: "Olympic Athlete & Sports Development Officer",
      topic: "Building Inclusive Sports Communities",
      status: "upcoming"
    },
    {
      id: 2,
      date: "June 20, 2024",
      time: "7:30 PM",
      venue: "TBC",
      address: "To be confirmed",
      speaker: "TBC",
      speakerRole: "To be confirmed",
      topic: "TBC",
      status: "planned"
    }
  ];

  const pastMeetings = [
    {
      id: 1,
      date: "December 8, 2023",
      venue: "East Grinstead RFC",
      speaker: "Mark Stevens",
      speakerRole: "Mid Sussex District Council Sports Development",
      topic: "Funding Opportunities for Local Sports Clubs",
      outcomes: [
        "New grant application process outlined for 2024",
        "5 clubs received direct guidance on funding applications",
        "Community partnership opportunities identified",
        "Equipment sharing scheme launched between 3 clubs"
      ]
    },
    {
      id: 2,
      date: "September 22, 2023",
      venue: "East Grinstead Swimming Club",
      speaker: "Dr. Emma Williams",
      speakerRole: "Sports Psychologist",
      topic: "Youth Engagement and Mental Wellbeing in Sport",
      outcomes: [
        "Mental health resources shared with all clubs",
        "Youth coaching workshop scheduled for November",
        "Inter-club youth tournament planning committee formed",
        "Best practices for supporting young athletes established"
      ]
    }
  ];

  return (
    <Layout>
      <div className="egsport-container py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">East Grinstead Sports Council</h1>
            <p className="text-xl text-gray-600 mb-6">
              Bringing our sports community together to share, learn, and grow
            </p>
            <div className="bg-egsport-blue/5 rounded-lg p-6 max-w-4xl mx-auto">
              <p className="text-lg text-gray-700">
                The East Grinstead Sports Council meets quarterly, rotating between different sports clubs 
                throughout the town. These gatherings bring together club representatives, local sports 
                facilities, accomplished athletes, and community leaders to network, share ideas, and 
                collaborate on initiatives that benefit our entire sports community.
              </p>
            </div>
          </div>

          {/* About Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader className="text-center">
                <Calendar className="h-8 w-8 text-egsport-blue mx-auto mb-2" />
                <CardTitle className="text-lg">Quarterly Meetings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Four meetings per year, rotating between different sports clubs to showcase facilities and build connections.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Users className="h-8 w-8 text-egsport-blue mx-auto mb-2" />
                <CardTitle className="text-lg">Diverse Speakers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Expert speakers including club representatives, sports professionals, athletes, and local councillors.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Award className="h-8 w-8 text-egsport-blue mx-auto mb-2" />
                <CardTitle className="text-lg">Collaborative Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Real outcomes that benefit the whole community through shared resources, knowledge, and partnerships.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Meetings */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Upcoming Meetings</h2>
            <div className="space-y-6">
              {upcomingMeetings.map((meeting) => (
                <Card key={meeting.id} className="border-l-4 border-l-egsport-blue">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{meeting.topic}</CardTitle>
                        <CardDescription className="text-lg font-medium text-egsport-blue mt-1">
                          {meeting.speaker} - {meeting.speakerRole}
                        </CardDescription>
                      </div>
                      <Badge variant={meeting.status === 'upcoming' ? 'default' : 'secondary'}>
                        {meeting.status === 'upcoming' ? 'Upcoming' : 'Planned'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">{meeting.date}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{meeting.time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <div>
                          <div className="font-medium">{meeting.venue}</div>
                          <div className="text-sm text-gray-600">{meeting.address}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Past Meetings & Outcomes */}
          <div>
            <h2 className="text-3xl font-bold mb-6">Past Meetings & Outcomes</h2>
            <div className="space-y-8">
              {pastMeetings.map((meeting) => (
                <Card key={meeting.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{meeting.topic}</CardTitle>
                        <CardDescription className="text-lg font-medium text-egsport-blue mt-1">
                          {meeting.speaker} - {meeting.speakerRole}
                        </CardDescription>
                        <CardDescription className="mt-2">
                          {meeting.date} at {meeting.venue}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <h4 className="font-semibold mb-3">Key Outcomes & Impact:</h4>
                    <ul className="space-y-2">
                      {meeting.outcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-egsport-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Join the Sports Council</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              All sports clubs in East Grinstead are welcome to participate in the Sports Council. 
              It's a fantastic opportunity to connect with other clubs, share resources, learn from experts, 
              and contribute to the growth of our sports community.
            </p>
            <p className="text-sm text-gray-500">
              For more information about upcoming meetings or to suggest topics, contact us through any of our member clubs.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SportsCouncil;
