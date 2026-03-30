#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>

@interface LogFileWriter : NSObject <RCTBridgeModule>
@end

@implementation LogFileWriter

RCT_EXPORT_MODULE(LogFileWriter);

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

// Get the log file path: ~/Library/Logs/OnePass/app.log
+ (NSString *)logFilePath {
  NSString *logsDir = [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) firstObject];
  NSString *onePassLogsDir = [logsDir stringByAppendingPathComponent:@"Logs/OnePass"];

  // Create directory if not exists
  NSFileManager *fm = [NSFileManager defaultManager];
  if (![fm fileExistsAtPath:onePassLogsDir]) {
    NSError *error = nil;
    [fm createDirectoryAtPath:onePassLogsDir
      withIntermediateDirectories:YES
                       attributes:nil
                            error:&error];
    if (error) {
      NSLog(@"[LogFileWriter] Failed to create log directory: %@", error);
    }
  }

  return [onePassLogsDir stringByAppendingPathComponent:@"app.log"];
}

// Write log entry to file
RCT_EXPORT_METHOD(writeLog:(NSString *)logLine
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  @try {
    NSString *filePath = [LogFileWriter logFilePath];

    // Add newline
    NSString *logWithNewline = [logLine stringByAppendingString:@"\n"];

    // Append to file
    NSFileHandle *fileHandle = [NSFileHandle fileHandleForWritingAtPath:filePath];
    if (fileHandle) {
      @try {
        [fileHandle seekToEndOfFile];
        NSData *data = [logWithNewline dataUsingEncoding:NSUTF8StringEncoding];
        if (data) {
          [fileHandle writeData:data];
        }
      } @finally {
        [fileHandle closeFile];
      }
    } else {
      // File doesn't exist, create it
      NSError *error = nil;
      BOOL success = [logWithNewline writeToFile:filePath atomically:YES encoding:NSUTF8StringEncoding error:&error];
      if (!success || error) {
        NSString *errorMsg = error ? error.localizedDescription : @"Unknown error writing file";
        reject(@"WRITE_ERROR", errorMsg, error);
        return;
      }
    }

    resolve(nil);
  } @catch (NSException *exception) {
    reject(@"WRITE_ERROR", exception.reason ?: @"Unknown exception", nil);
  }
}

// Get log file path for display
RCT_EXPORT_METHOD(getLogFilePath:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  resolve([LogFileWriter logFilePath]);
}

// Clear log file
RCT_EXPORT_METHOD(clearLogFile:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  @try {
    NSString *filePath = [LogFileWriter logFilePath];
    NSFileManager *fm = [NSFileManager defaultManager];

    if ([fm fileExistsAtPath:filePath]) {
      NSError *error = nil;
      BOOL success = [fm removeItemAtPath:filePath error:&error];
      if (!success || error) {
        NSString *errorMsg = error ? error.localizedDescription : @"Unknown error clearing file";
        reject(@"CLEAR_ERROR", errorMsg, error);
        return;
      }
    }

    resolve(nil);
  } @catch (NSException *exception) {
    reject(@"CLEAR_ERROR", exception.reason ?: @"Unknown exception", nil);
  }
}

// Get log file size in bytes
RCT_EXPORT_METHOD(getLogFileSize:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  @try {
    NSString *filePath = [LogFileWriter logFilePath];
    NSFileManager *fm = [NSFileManager defaultManager];

    if ([fm fileExistsAtPath:filePath]) {
      NSDictionary *attributes = [fm attributesOfItemAtPath:filePath error:nil];
      if (attributes) {
        unsigned long long fileSize = [attributes fileSize];
        resolve(@(fileSize));
      } else {
        resolve(@0);
      }
    } else {
      resolve(@0);
    }
  } @catch (NSException *exception) {
    reject(@"SIZE_ERROR", exception.reason ?: @"Unknown exception", nil);
  }
}

// Rotate log if it exceeds max size (in MB)
RCT_EXPORT_METHOD(rotateLogIfNeeded:(double)maxSizeMB
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  @try {
    NSString *filePath = [LogFileWriter logFilePath];
    NSFileManager *fm = [NSFileManager defaultManager];

    if (![fm fileExistsAtPath:filePath]) {
      resolve(@(NO));
      return;
    }

    NSDictionary *attributes = [fm attributesOfItemAtPath:filePath error:nil];
    if (!attributes) {
      resolve(@(NO));
      return;
    }

    unsigned long long fileSize = [attributes fileSize];
    unsigned long long maxSizeBytes = (unsigned long long)(maxSizeMB * 1024 * 1024);

    if (fileSize > maxSizeBytes) {
      // Rename to .old
      NSString *backupPath = [filePath stringByAppendingString:@".old"];

      // Remove old backup if exists
      if ([fm fileExistsAtPath:backupPath]) {
        [fm removeItemAtPath:backupPath error:nil];
      }

      // Rename current log to backup
      NSError *error = nil;
      BOOL success = [fm moveItemAtPath:filePath toPath:backupPath error:&error];

      if (!success || error) {
        NSString *errorMsg = error ? error.localizedDescription : @"Unknown error rotating file";
        reject(@"ROTATE_ERROR", errorMsg, error);
        return;
      }

      resolve(@(YES));
    } else {
      resolve(@(NO));
    }
  } @catch (NSException *exception) {
    reject(@"ROTATE_ERROR", exception.reason ?: @"Unknown exception", nil);
  }
}

// Read last N lines of log file
RCT_EXPORT_METHOD(readLastLines:(double)linesCount
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject) {
  @try {
    NSString *filePath = [LogFileWriter logFilePath];
    NSFileManager *fm = [NSFileManager defaultManager];

    if (![fm fileExistsAtPath:filePath]) {
      resolve(@"");
      return;
    }

    NSString *content = [NSString stringWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:nil];
    if (!content || content.length == 0) {
      resolve(@"");
      return;
    }

    NSArray *lines = [content componentsSeparatedByString:@"\n"];
    NSInteger count = (NSInteger)linesCount;
    NSInteger totalLines = (NSInteger)[lines count];

    if (totalLines <= count) {
      resolve(content);
      return;
    }

    NSArray *lastLines = [lines subarrayWithRange:NSMakeRange(totalLines - count, count)];
    resolve([lastLines componentsJoinedByString:@"\n"]);
  } @catch (NSException *exception) {
    reject(@"READ_ERROR", exception.reason ?: @"Unknown exception", nil);
  }
}

@end
