
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define the volunteer position form schema
const positionSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  responsibilities: z.string().optional(),
  requirements: z.string().optional(),
  time_commitment: z.string().optional(),
  location: z.string().optional(),
  contact_info: z.string().optional(),
  is_live: z.boolean().default(false),
});

type PositionFormValues = z.infer<typeof positionSchema>;

interface Position extends PositionFormValues {
  id: string;
  created_at: string;
  updated_at: string;
  club_id: string;
}

const VolunteerPositions = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  
  // Initialize form with react-hook-form and zod validation
  const form = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      title: "",
      description: "",
      responsibilities: "",
      requirements: "",
      time_commitment: "",
      location: "",
      contact_info: "",
      is_live: false,
    },
  });

  // Fetch volunteer positions
  useEffect(() => {
    const fetchPositions = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('club_volunteer_positions')
          .select('*')
          .eq('club_id', user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setPositions(data || []);
      } catch (error) {
        console.error('Error fetching volunteer positions:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load positions',
          description: 'There was a problem loading your volunteer positions.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, [user]);

  // Handle form submission for create/edit
  const onSubmit = async (data: PositionFormValues) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      if (currentPosition) {
        // Update existing position
        const { error } = await supabase
          .from('club_volunteer_positions')
          .update({
            title: data.title,
            description: data.description,
            responsibilities: data.responsibilities || null,
            requirements: data.requirements || null,
            time_commitment: data.time_commitment || null,
            location: data.location || null,
            contact_info: data.contact_info || null,
            is_live: data.is_live,
          })
          .eq('id', currentPosition.id)
          .eq('club_id', user.id);
          
        if (error) throw error;
        
        // Update local state
        setPositions(positions.map(pos => 
          pos.id === currentPosition.id ? { ...pos, ...data } : pos
        ));
        
        toast({
          title: 'Position updated',
          description: 'Volunteer position has been updated successfully.',
        });
      } else {
        // Create new position
        const { data: newPosition, error } = await supabase
          .from('club_volunteer_positions')
          .insert({
            club_id: user.id,
            title: data.title,
            description: data.description,
            responsibilities: data.responsibilities || null,
            requirements: data.requirements || null,
            time_commitment: data.time_commitment || null,
            location: data.location || null,
            contact_info: data.contact_info || null,
            is_live: data.is_live,
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Add to local state
        if (newPosition) {
          setPositions([newPosition, ...positions]);
        }
        
        toast({
          title: 'Position created',
          description: 'New volunteer position has been created successfully.',
        });
      }
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      setCurrentPosition(null);
      form.reset({
        title: "",
        description: "",
        responsibilities: "",
        requirements: "",
        time_commitment: "",
        location: "",
        contact_info: "",
        is_live: false,
      });
      
    } catch (error) {
      console.error('Error saving volunteer position:', error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'There was a problem saving the volunteer position.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle position deletion
  const handleDelete = async (positionId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this volunteer position?')) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('club_volunteer_positions')
        .delete()
        .eq('id', positionId)
        .eq('club_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setPositions(positions.filter(pos => pos.id !== positionId));
      
      toast({
        title: 'Position deleted',
        description: 'Volunteer position has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting volunteer position:', error);
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'There was a problem deleting the volunteer position.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle toggling position visibility (is_live)
  const toggleVisibility = async (position: Position) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const newIsLive = !position.is_live;
      
      const { error } = await supabase
        .from('club_volunteer_positions')
        .update({ is_live: newIsLive })
        .eq('id', position.id)
        .eq('club_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setPositions(positions.map(pos => 
        pos.id === position.id ? { ...pos, is_live: newIsLive } : pos
      ));
      
      toast({
        title: `Position is now ${newIsLive ? 'visible' : 'hidden'}`,
        description: `Volunteer position visibility has been updated.`,
      });
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: 'There was a problem updating the position visibility.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit dialog with position data
  const openEditDialog = (position: Position) => {
    setCurrentPosition(position);
    form.reset({
      title: position.title,
      description: position.description,
      responsibilities: position.responsibilities || "",
      requirements: position.requirements || "",
      time_commitment: position.time_commitment || "",
      location: position.location || "",
      contact_info: position.contact_info || "",
      is_live: position.is_live,
    });
    setIsDialogOpen(true);
  };

  // Open create dialog
  const openCreateDialog = () => {
    setCurrentPosition(null);
    form.reset({
      title: "",
      description: "",
      responsibilities: "",
      requirements: "",
      time_commitment: "",
      location: "",
      contact_info: "",
      is_live: false,
    });
    setIsDialogOpen(true);
  };

  if (isLoading && positions.length === 0) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-egsport-blue mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Volunteer Positions</h2>
        <Button onClick={openCreateDialog} className="bg-egsport-blue hover:bg-egsport-blue/90">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Position
        </Button>
      </div>

      {positions.length === 0 ? (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription>
            You haven't created any volunteer positions yet. 
            Add positions to advertise roles that need to be filled in your club.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6">
          {positions.map((position) => (
            <Card key={position.id} className={!position.is_live ? "border-dashed opacity-70" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{position.title}</CardTitle>
                    <CardDescription>{position.location || "No location specified"}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleVisibility(position)}
                      title={position.is_live ? "Hide position" : "Make position visible"}
                    >
                      {position.is_live ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(position)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(position.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {!position.is_live && (
                  <div className="text-sm text-yellow-600 mt-2">
                    This position is hidden from public view
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-700">{position.description}</p>
                </div>
                
                {position.responsibilities && (
                  <div>
                    <h4 className="font-semibold text-sm">Responsibilities</h4>
                    <p className="text-gray-700 text-sm">{position.responsibilities}</p>
                  </div>
                )}
                
                {position.requirements && (
                  <div>
                    <h4 className="font-semibold text-sm">Requirements</h4>
                    <p className="text-gray-700 text-sm">{position.requirements}</p>
                  </div>
                )}
                
                {position.time_commitment && (
                  <div>
                    <h4 className="font-semibold text-sm">Time Commitment</h4>
                    <p className="text-gray-700 text-sm">{position.time_commitment}</p>
                  </div>
                )}
                
                {position.contact_info && (
                  <div>
                    <h4 className="font-semibold text-sm">Contact</h4>
                    <p className="text-gray-700 text-sm">{position.contact_info}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Position Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentPosition ? "Edit Volunteer Position" : "Create Volunteer Position"}</DialogTitle>
            <DialogDescription>
              {currentPosition 
                ? "Update the details for this volunteer position." 
                : "Add a new volunteer position to your club."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Title field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title*</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Youth Coach, Treasurer, Event Coordinator" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description*</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe this volunteer position..."
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a general overview of the position.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Responsibilities field */}
              <FormField
                control={form.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsibilities</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What will the volunteer be responsible for?"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Requirements field */}
              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any required skills, qualifications or checks?"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Commitment field */}
              <FormField
                control={form.control}
                name="time_commitment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Commitment</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., 2 hours weekly, 4 hours monthly" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location field */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Where will the volunteer work?" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact Info field */}
              <FormField
                control={form.control}
                name="contact_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Information</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Contact details for this position" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Who should interested volunteers contact? (If different from club details)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Is Live toggle */}
              <FormField
                control={form.control}
                name="is_live"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Make this position public</FormLabel>
                      <FormDescription>
                        When enabled, this position will be visible on your public club page.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-egsport-blue hover:bg-egsport-blue/90"
                >
                  {currentPosition ? "Save Changes" : "Create Position"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VolunteerPositions;
