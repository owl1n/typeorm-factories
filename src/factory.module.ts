import { Module, OnModuleInit } from "@nestjs/common";
import { FactoryProvider } from "./factory.provider";
import { ModuleOptions } from "./types";

@Module({ providers: [FactoryProvider] })
export class FactoryModule implements OnModuleInit {
  constructor(private readonly provider: FactoryProvider) {}

  onModuleInit(): any {
    const factories = this.provider.loadFiles(["**/*.factory{.js,.ts}"]);
    this.provider.importFiles(factories);
  }
}
