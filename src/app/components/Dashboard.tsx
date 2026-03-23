import { Link } from "react-router";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp, Clock, Heart, ShoppingBag, CheckCircle, ArrowRight } from "lucide-react";
import { MOCK_ITEMS, MOCK_ORDERS, MY_LISTINGS, CURRENT_USER } from "../data/mockData";

export function Dashboard() {
  const recentItems = MOCK_ITEMS.slice(0, 6);
  const stats = [
    { label: "Active Listings", value: MY_LISTINGS.length, icon: ShoppingBag, color: "text-blue-600" },
    { label: "Pending Orders", value: MOCK_ORDERS.filter(o => o.status === "pending").length, icon: Clock, color: "text-yellow-600" },
    { label: "Completed Sales", value: CURRENT_USER.completedTransactions, icon: CheckCircle, color: "text-green-600" },
    { label: "Saved Items", value: 4, icon: Heart, color: "text-red-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#0A1E3C] to-[#163A5F] rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {CURRENT_USER.name}! 👋</h1>
            <p className="text-gray-200">
              Find great deals on textbooks, supplies, and more from fellow Menlo School students.
            </p>
          </div>
          <Link to="/create">
            <Button className="bg-[#D4AF37] text-[#0A1E3C] hover:bg-[#E8D5A1] font-semibold">
              Post New Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="text-[#0A1E3C]" size={20} />
                  Trending Items
                </CardTitle>
                <CardDescription>Popular listings right now</CardDescription>
              </div>
              <Link to="/browse">
                <Button variant="ghost" size="sm" className="text-[#0A1E3C]">
                  View All <ArrowRight size={16} className="ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentItems.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/item/${item.id}`}
                  className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">{item.category}</Badge>
                      <span className="text-xs text-gray-500">{item.views} views</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0A1E3C]">${item.price}</p>
                    <p className="text-xs text-gray-500">{item.condition}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/create">
              <Button className="w-full justify-start bg-[#0A1E3C] hover:bg-[#050F1E]">
                Post New Item
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="outline" className="w-full justify-start">
                Browse Marketplace
              </Button>
            </Link>
            <Link to="/messages">
              <Button variant="outline" className="w-full justify-start">
                View Messages
              </Button>
            </Link>
            <Link to="/my-listings">
              <Button variant="outline" className="w-full justify-start">
                Manage Listings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Listings Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recent Listings</h2>
            <p className="text-gray-600">Latest items from your classmates</p>
          </div>
          <Link to="/browse">
            <Button variant="outline" className="text-[#0A1E3C] border-[#0A1E3C]">
              Browse All
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentItems.map((item) => (
            <Link key={item.id} to={`/item/${item.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-3 right-3 bg-white text-gray-900">
                    {item.condition}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">{item.title}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-[#0A1E3C]">${item.price}</span>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Heart size={14} /> {item.likes}
                    </span>
                    <span>{item.seller.name}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}