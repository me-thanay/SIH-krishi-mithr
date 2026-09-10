import { Card, CardContent } from '@/components/ui/card'
import { Shield, Users } from 'lucide-react'

export function Features() {
    return (
        <section className="bg-gray-50 py-16 md:py-32">
            <div className="mx-auto max-w-3xl px-6 lg:max-w-5xl">
                <div className="relative">
                    <div className="relative z-10 grid grid-cols-6 gap-3">
                        <Card className="relative col-span-full flex overflow-hidden lg:col-span-2">
                            <CardContent className="relative m-auto size-fit pt-6">
                                <div className="relative flex h-24 w-56 items-center">
                                    <span className="mx-auto block w-fit text-5xl font-semibold">100%</span>
                                </div>
                                <h2 className="mt-6 text-center text-3xl font-semibold">Customizable</h2>
                            </CardContent>
                        </Card>
                        <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                            <CardContent className="pt-6">
                                <div className="relative mx-auto flex aspect-square size-32 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border">
                                    <Shield className="m-auto size-12 text-primary" strokeWidth={1} />
                                </div>
                                <div className="relative z-10 mt-6 space-y-2 text-center">
                                    <h2 className="text-lg font-medium transition">Secure by default</h2>
                                    <p className="text-foreground">Farm data stays on your devices, with live MQTT monitoring you control.</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="relative col-span-full overflow-hidden sm:col-span-3 lg:col-span-2">
                            <CardContent className="pt-6">
                                <div className="flex justify-center pt-6">
                                    <Users className="size-16 text-primary" strokeWidth={1} />
                                </div>
                                <div className="relative z-10 mt-14 space-y-2 text-center">
                                    <h2 className="text-lg font-medium transition">Faster than light</h2>
                                    <p className="text-foreground">Sensor updates stream in as soon as the field device publishes them.</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="relative col-span-full overflow-hidden lg:col-span-3">
                            <CardContent className="grid pt-6 sm:grid-cols-2">
                                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                    <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border">
                                        <Shield className="m-auto size-5" strokeWidth={1} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-lg font-medium text-zinc-800 transition">Faster than light</h2>
                                        <p className="text-foreground">Field alerts and irrigation controls stay in sync with your hardware.</p>
                                    </div>
                                </div>
                                <div className="relative -mb-6 -mr-6 mt-6 h-fit rounded-tl-lg border-l border-t p-6 py-6 sm:ml-6">
                                    <div className="absolute left-3 top-2 flex gap-1">
                                        <span className="block size-2 rounded-full border bg-red-400"></span>
                                        <span className="block size-2 rounded-full border bg-yellow-400"></span>
                                        <span className="block size-2 rounded-full border bg-green-400"></span>
                                    </div>
                                    <img
                                        className="mt-4 h-40 w-full rounded-md object-cover"
                                        src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80"
                                        alt="Crop field"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="relative col-span-full overflow-hidden lg:col-span-3">
                            <CardContent className="grid h-full pt-6 sm:grid-cols-2">
                                <div className="relative z-10 flex flex-col justify-between space-y-12 lg:space-y-6">
                                    <div className="relative flex aspect-square size-12 rounded-full border before:absolute before:-inset-2 before:rounded-full before:border">
                                        <Users className="m-auto size-6" strokeWidth={1} />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-lg font-medium transition">Keep your loved ones safe</h2>
                                        <p className="text-foreground">Share farm status with family so everyone knows the field is healthy.</p>
                                    </div>
                                </div>
                                <div className="relative mt-6 before:absolute before:inset-0 before:mx-auto before:w-px before:bg-border sm:-my-6 sm:-mr-6">
                                    <div className="relative flex h-full flex-col justify-center space-y-6 py-6">
                                        <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                                            <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm">Likeur</span>
                                            <div className="size-7 ring-4 ring-background">
                                                <img className="size-full rounded-full object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=80" alt="" />
                                            </div>
                                        </div>
                                        <div className="relative ml-[calc(50%-1rem)] flex items-center gap-2">
                                            <div className="size-8 ring-4 ring-background">
                                                <img className="size-full rounded-full object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=128&h=128&q=80" alt="" />
                                            </div>
                                            <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm">M. Irung</span>
                                        </div>
                                        <div className="relative flex w-[calc(50%+0.875rem)] items-center justify-end gap-2">
                                            <span className="block h-fit rounded border px-2 py-1 text-xs shadow-sm">B. Ng</span>
                                            <div className="size-7 ring-4 ring-background">
                                                <img className="size-full rounded-full object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=128&h=128&q=80" alt="" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    )
}
