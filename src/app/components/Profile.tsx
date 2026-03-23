import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { ShieldCheck, Star, Package, CheckCircle, Mail, Calendar, Edit } from "lucide-react";
import { CURRENT_USER, MY_LISTINGS, MOCK_ORDERS } from "../data/mockData";
import { format } from "date-fns";

export function Profile() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account and settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center">
              <Avatar className="h-24 w-24 bg-[#0A1E3C] mx-auto mb-4">
                <AvatarFallback className="text-white text-3xl">
                  {CURRENT_USER.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center justify-center gap-2">
                {CURRENT_USER.name}
                {CURRENT_USER.isVerified && (
                  <ShieldCheck size={20} className="text-[#0A1E3C]" />
                )}
              </h2>
              <p className="text-sm text-gray-600 mb-4">{CURRENT_USER.email}</p>
              <Badge className="bg-green-500 mb-4">Verified Student</Badge>

              <Separator className="my-4" />

              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    Rating
                  </span>
                  <span className="font-semibold">{CURRENT_USER.rating.toFixed(1)}/5.0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    Sales Completed
                  </span>
                  <span className="font-semibold">{CURRENT_USER.completedTransactions}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Package size={16} className="text-blue-500" />
                    Active Listings
                  </span>
                  <span className="font-semibold">{MY_LISTINGS.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    Member Since
                  </span>
                  <span className="font-semibold">
                    {format(new Date(CURRENT_USER.joinedDate), "MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={CURRENT_USER.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail size={14} className="inline mr-1" />
                  Email Address
                </Label>
                <Input id="email" type="email" defaultValue={CURRENT_USER.email} disabled />
                <p className="text-xs text-gray-500">
                  Verified @menloschool.edu email
                </p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Email notifications for new messages</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Alert me when someone likes my items</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Notify when items I want are posted</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700">Weekly summary of marketplace activity</span>
                  <input type="checkbox" className="rounded" />
                </label>
              </div>
            </div>

            <Separator />

            <div className="flex gap-3">
              <Button className="bg-[#0A1E3C] hover:bg-[#050F1E]">
                <Edit size={16} className="mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent transactions and orders</CardDescription>
        </CardHeader>
        <CardContent>
          {MOCK_ORDERS.length > 0 ? (
            <div className="space-y-4">
              {MOCK_ORDERS.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <img
                    src={order.item.image}
                    alt={order.item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{order.item.title}</h3>
                    <p className="text-sm text-gray-600">
                      Seller: {order.seller.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(order.createdDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#0A1E3C]">${order.item.price}</p>
                    <Badge
                      variant={order.status === "completed" ? "default" : "secondary"}
                      className={
                        order.status === "completed"
                          ? "bg-green-500"
                          : order.status === "confirmed"
                          ? "bg-blue-500"
                          : "bg-yellow-500"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          )}
        </CardContent>
      </Card>

      {/* Safety & Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="text-[#0A1E3C]" size={20} />
            Safety & Community Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Verified Student Status</h3>
              <p className="text-sm text-gray-600">
                Your @menloschool.edu email is verified. This helps maintain a safe,
                trusted community.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Safe Meetups</h3>
              <p className="text-sm text-gray-600">
                Always meet at verified campus locations during school hours. Never share
                personal contact information.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Report Issues</h3>
              <p className="text-sm text-gray-600">
                See something suspicious? Use the flag button to report items or users
                that violate our guidelines.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Build Trust</h3>
              <p className="text-sm text-gray-600">
                Complete transactions on time, be honest about item conditions, and
                communicate clearly to build your reputation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}